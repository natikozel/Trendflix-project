import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';

class PearsonCorrelationRecommender {
  constructor() {
    this.vectorProcessor = new VectorProcessor();
    this.userProcessor = new UserInputProcessor();
  }

  // Calculate Pearson correlation similarity between two vectors
  calculatePearsonSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB) {
      return 0;
    }

    try {
      // Same vector type determination and preparation...
      const isMapA = vectorA instanceof Map;
      const isMapB = vectorB instanceof Map;
      
      const getValue = (vector, isMap, key) => {
        if (isMap) {
          return vector.has(key) ? vector.get(key) : 0;
        } else {
          return vector[key] || 0;
        }
      };
      
      // Get all dimensions and track shared ones
      const dimensions = new Set();
      const sharedDimensions = [];
      
      if (isMapA) {
        for (const key of vectorA.keys()) {
          dimensions.add(key);
          if ((isMapB && vectorB.has(key) && vectorB.get(key) > 0) || 
              (!isMapB && vectorB[key] && vectorB[key] > 0)) {
            sharedDimensions.push(key);
          }
        }
      } else {
        Object.keys(vectorA).forEach(key => {
          dimensions.add(key);
          if ((isMapB && vectorB.has(key) && vectorB.get(key) > 0) || 
              (!isMapB && vectorB[key] && vectorB[key] > 0)) {
            sharedDimensions.push(key);
          }
        });
      }
      
      // If very few shared dimensions, we'll use a hybrid approach
      if (sharedDimensions.length < 5) {
        // Fall back to a cosine-like approach for sparse vectors
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        
        dimensions.forEach(dim => {
          const a = getValue(vectorA, isMapA, dim);
          const b = getValue(vectorB, isMapB, dim);
          
          dotProduct += a * b;
          magnitudeA += a * a;
          magnitudeB += b * b;
        });
        
        magnitudeA = Math.sqrt(magnitudeA || 1e-10);
        magnitudeB = Math.sqrt(magnitudeB || 1e-10);
        
        const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB);
        return Math.max(0, cosineSimilarity) * (1 + sharedDimensions.length * 0.05);
      }
      
      // Continue with Pearson for cases with enough shared dimensions
      let sumA = 0, sumB = 0;
      
      sharedDimensions.forEach(dim => {
        sumA += getValue(vectorA, isMapA, dim);
        sumB += getValue(vectorB, isMapB, dim);
      });
      
      const meanA = sumA / sharedDimensions.length;
      const meanB = sumB / sharedDimensions.length;
      
      // Calculate Pearson components
      let numerator = 0;
      let denominatorA = 0;
      let denominatorB = 0;
      
      sharedDimensions.forEach(dim => {
        const a = getValue(vectorA, isMapA, dim);
        const b = getValue(vectorB, isMapB, dim);
        
        const diffA = a - meanA;
        const diffB = b - meanB;
        
        numerator += diffA * diffB;
        denominatorA += diffA * diffA;
        denominatorB += diffB * diffB;
      });
      
      // Safety checks
      if (denominatorA <= 0 || denominatorB <= 0) {
        // Fall back to dimensionality boost
        return Math.min(0.3, sharedDimensions.length * 0.03);
      }
      
      // Calculate correlation
      const correlation = numerator / (Math.sqrt(denominatorA) * Math.sqrt(denominatorB));
      
      // Apply nonlinear scaling to boost higher correlations
      const boostedCorrelation = correlation < 0 ? 0 : Math.pow(correlation, 0.8);
      
      // Include a boost for having many shared dimensions
      const dimensionalityBoost = Math.min(0.3, Math.sqrt(sharedDimensions.length) * 0.05);
      
      // Combine correlation with dimensionality boost
      const scaledSimilarity = ((boostedCorrelation + 1) / 2) + dimensionalityBoost;
      
      return Math.min(1, Math.max(0, scaledSimilarity));
    } catch (error) {
      console.error('Error calculating Pearson similarity:', error);
      return 0;
    }
  }

  // Apply additional weights based on movie metadata - same as in original recommender
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

  // Get recommendations based on user input - similar to original but using Pearson correlation
  async getRecommendations(userInputData, options = {}) {
    try {
      console.log("Starting Pearson-based recommendation process");
      
      const {
        maxResults = 9,
        similarityThreshold = 0.04, // Pearson may require a different threshold
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
          
          // Calculate similarity using Pearson correlation
          const similarity = this.calculatePearsonSimilarity(userVector, movie.vector);
          
          // Log the movie name and similarity
          console.log(`Pearson Similarity for "${movie.movieName}": ${similarity.toFixed(4)}`);
          
          // Skip if below threshold
          if (similarity < similarityThreshold) continue;
          
          candidateMovies.push({
            movie,
            similarity
          });
        } catch (error) {
          console.error(`Error processing movie ${movie.movieName}:`, error);
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

      // Log the top recommendations
      console.log("\nTop recommendations using Pearson correlation:");
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

      console.log("Pearson-based recommendation process complete.");
      return formattedResults;
    } catch (error) {
      console.error('Error getting recommendations with Pearson correlation:', error);
      throw error;
    }
  }
}

export default PearsonCorrelationRecommender;
