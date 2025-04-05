import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';

class Recommender {
  constructor() {
    this.vectorProcessor = new VectorProcessor();
    this.userProcessor = new UserInputProcessor();
  }

  // Calculate cosine similarity between two vectors
  calculateCosineSimilarity(vectorA, vectorB) {
    // Safety check for inputs
    if (!vectorA || !vectorB) {
      return 0;
    }

    try {
      // Determine what type of vectors we're dealing with
      const isMapA = vectorA instanceof Map;
      const isMapB = vectorB instanceof Map;
      
      // Helper to safely get a value from either Map or object
      const getValue = (vector, isMap, key) => {
        if (isMap) {
          return vector.has(key) ? vector.get(key) : 0;
        } else {
          return vector[key] || 0;
        }
      };
      
      // Get all unique dimensions
      const dimensions = new Set();
      
      // Add keys from vectorA
      if (isMapA) {
        for (const key of vectorA.keys()) {
          dimensions.add(key);
        }
      } else {
        Object.keys(vectorA).forEach(key => dimensions.add(key));
      }
      
      // Add keys from vectorB
      if (isMapB) {
        for (const key of vectorB.keys()) {
          dimensions.add(key);
        }
      } else {
        Object.keys(vectorB).forEach(key => dimensions.add(key));
      }
      
      if (dimensions.size === 0) {
        return 0;
      }

      // Calculate dot product
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;
      let sharedDimensions = 0;

      dimensions.forEach(dim => {
        const a = getValue(vectorA, isMapA, dim);
        const b = getValue(vectorB, isMapB, dim);
        
        // Check for valid numbers
        if (isNaN(a) || isNaN(b)) {
          return; // Skip this dimension
        }
        
        // Track shared dimensions with non-zero values
        if (a !== 0 && b !== 0) {
          sharedDimensions++;
        }
        
        dotProduct += a * b;
        magnitudeA += a * a;
        magnitudeB += b * b;
      });

      // Calculate magnitudes, with safety checks
      magnitudeA = Math.sqrt(Math.max(0, magnitudeA));
      magnitudeB = Math.sqrt(Math.max(0, magnitudeB));
      
      // Return cosine similarity with safety checks
      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0; // Avoid division by zero
      }
      
      const similarity = dotProduct / (magnitudeA * magnitudeB);
      
      // Final safety check for NaN result
      if (isNaN(similarity)) {
        return 0;
      }
      
      return similarity;
    } catch (error) {
      return 0;
    }
  }

  // Apply additional weights based on movie metadata
  applyMetadataWeights(similarity, movie, userPreferences) {
    let weightedScore = similarity;

    
    if (movie.rating) {
      const ratingBoost = 1 + (movie.rating / 20);
      weightedScore *= ratingBoost;
    }

    // Weight by release recency (if available)
    if (movie.releaseYear && userPreferences.preferNewReleases) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - movie.releaseYear;
      const recencyBoost = 1 + (Math.max(0, 1 - (age / 10)) * 0.3);
      weightedScore *= recencyBoost;
    }

    // Weight by popularity (if available)
    if (movie.popularity) {
      const popularityBoost = 1 + (movie.popularity * 0.2);
      weightedScore *= popularityBoost;
    }

    // Duration preference adjustment
    if (userPreferences.preferredDuration && movie.duration) {
      const durationDiff = Math.abs(userPreferences.preferredDuration - movie.duration);
      const durationFactor = 1 + (Math.max(0, 1 - (durationDiff / 60)) * 0.1);
      weightedScore *= durationFactor;
    }

    // Genre matching (if user has preferred genres)
    if (userPreferences.preferredGenres && userPreferences.preferredGenres.length > 0 && movie.genres) {
      // Count how many preferred genres match
      const matchingGenres = movie.genres.filter(genre => 
        userPreferences.preferredGenres.includes(genre)
      ).length;
      
      if (matchingGenres > 0) {
        // Boost based on proportion of matching genres
        const genreBoost = 1 + (matchingGenres / userPreferences.preferredGenres.length) * 0.3;
        weightedScore *= genreBoost;
      }
    }

    return weightedScore;
  }

  // Get recommendations based on user input
  async getRecommendations(userInputData, options = {}) {
    try {
      console.log("Starting recommendation process");
      
      const {
        maxResults = 9,
        similarityThreshold = 0.03,
        includeMetadata = true,
        preferredGenres = []
      } = options;

      // Process user input into vector
      let userVector;
      let userPreferences;
      
      // Check if the input is already processed (has vector property)
      if (userInputData.vector) {
        userVector = userInputData.vector;
        userPreferences = userInputData.processedInput?.preferences || {};
      } else {
        // Process user input into vector if it's not already processed
        const processedData = await this.userProcessor.processUserInput(userInputData);
        userVector = processedData.vector;
        userPreferences = processedData.processedInput.preferences;
      }

      // Initialize the database connection
      await movieDatabaseService.initialize();
      
      // Get vectorized movies from the database
      // If user has preferred genres, use those to filter initially
      const hasGenrePreferences = preferredGenres && preferredGenres.length > 0;
      const vectorizedMovies = hasGenrePreferences 
        ? await movieDatabaseService.getVectorizedMoviesByGenres(preferredGenres, 200)
        : await movieDatabaseService.getVectorizedMovies(200);
      
      console.log(`Retrieved ${vectorizedMovies.length} vectorized movies from database`);
      
      if (vectorizedMovies.length === 0) {
        console.warn("No vectorized movies found in database");
        return [];
      }
      
      // Calculate similarities and collect candidates
      const candidateMovies = [];
      
      for (const movie of vectorizedMovies) {
        try {
          // Check if movie has vector data
          if (!movie.vector) {
            continue;
          }
          
          // Calculate similarity
          const similarity = this.calculateCosineSimilarity(userVector, movie.vector);
          
          // Only log the movie name and similarity - keep this log
          console.log(`Similarity for "${movie.movieName}": ${similarity.toFixed(4)}`);
          
          // Skip if below threshold
          if (similarity < similarityThreshold) continue;
          
          candidateMovies.push({
            movie,
            similarity
          });
        } catch (error) {
        }
      }
      
      console.log(`\nFound ${candidateMovies.length} candidate movies above similarity threshold ${similarityThreshold}`);
      
      // Sort candidates by similarity
      candidateMovies.sort((a, b) => b.similarity - a.similarity);
      
      // Apply additional weights and prepare final recommendations
      const recommendations = candidateMovies.map(candidate => {
        const { movie, similarity } = candidate;
        
        // Apply additional weights if needed
        const finalScore = includeMetadata ? this.applyMetadataWeights(similarity, movie, userPreferences) : similarity;
          
        return {
          movieId: movie.movieId,
          movieName: movie.movieName,
          similarity,
          finalScore,
          movie
        };
      });
      
      // Sort by final score and limit results
      const sortedRecommendations = recommendations
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, maxResults);

      // Log the top recommendations - keep this log
      console.log("\nTop recommendations:");
      sortedRecommendations.forEach((rec, index) => {
        console.log(`${index + 1}. "${rec.movieName}" - Similarity: ${rec.similarity.toFixed(4)}, Final Score: ${rec.finalScore.toFixed(4)}`);
      });

      // Format results to return only necessary data
      const formattedResults = sortedRecommendations.map(rec => ({
        movieId: rec.movieId,
        movieName: rec.movieName,
        similarity: parseFloat(rec.similarity.toFixed(4)),
        finalScore: parseFloat(rec.finalScore.toFixed(4)),
        metadata: includeMetadata ? {
          rating: rec.movie.rating,
          releaseYear: rec.movie.releaseYear,
          duration: rec.movie.duration,
          genres: rec.movie.genres,
          synopsis: rec.movie.synopsis?.substring(0, 200) + (rec.movie.synopsis?.length > 200 ? '...' : ''),
          posterUrl: rec.movie.posterUrl
        } : undefined
      }));

      console.log("Recommendation process complete.");
      return formattedResults;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
}

export default Recommender; 