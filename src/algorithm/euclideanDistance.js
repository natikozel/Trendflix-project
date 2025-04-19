/**
 * Euclidean Distance Recommender
 * 
 * This recommender uses Euclidean distance to compare user preferences with movies.
 * It calculates the "straight-line" distance between two vectors in an n-dimensional space.
 * 
 * Unlike cosine similarity, Euclidean distance considers the magnitude of the vectors,
 * making it potentially more suited for recommendation problems where 
 * the absolute values of features are important, not just their directions.
 * 
 * Since Euclidean distance gives a dissimilarity score (lower is better),
 * we convert it to a similarity score for consistency with the existing system.
 */

import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';

class EuclideanDistanceRecommender {
  constructor() {
    this.vectorProcessor = new VectorProcessor();
    this.userProcessor = new UserInputProcessor();
  }

  // Calculate Euclidean distance similarity between two vectors
  calculateEuclideanSimilarity(vectorA, vectorB) {
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
      
      // Get shared dimensions with non-zero values in both vectors
      const dimensions = new Set();
      const sharedDimensions = new Set();
      
      // Add keys from both vectors and track shared dimensions
      if (isMapA) {
        for (const key of vectorA.keys()) {
          dimensions.add(key);
          if (isMapB ? vectorB.has(key) && vectorB.get(key) > 0 : vectorB[key] > 0) {
            sharedDimensions.add(key);
          }
        }
      } else {
        Object.keys(vectorA).forEach(key => {
          dimensions.add(key);
          if (isMapB ? vectorB.has(key) && vectorB.get(key) > 0 : vectorB[key] > 0) {
            sharedDimensions.add(key);
          }
        });
      }
      
      if (isMapB) {
        for (const key of vectorB.keys()) {
          dimensions.add(key);
        }
      } else {
        Object.keys(vectorB).forEach(key => {
          dimensions.add(key);
        });
      }
      
      if (dimensions.size === 0) {
        return 0;
      }

      // Boost factor for having more shared dimensions
      const sharedTermBoost = Math.sqrt(sharedDimensions.size) * 0.1 + 1;
      
      // Calculate squared difference
      let sumSquaredDiff = 0;
      let sumSharedTerms = 0;

      dimensions.forEach(dim => {
        const valueA = getValue(vectorA, isMapA, dim);
        const valueB = getValue(vectorB, isMapB, dim);
        
        if (isNaN(valueA) || isNaN(valueB)) {
          return;
        }
        
        // Apply heavier weight to shared dimensions
        const weight = sharedDimensions.has(dim) ? 2.0 : 0.5; 
        const diff = (valueA - valueB) * weight;
        sumSquaredDiff += diff * diff;
        
        // Sum product of shared terms (similar to cosine numerator)
        if (valueA > 0 && valueB > 0) {
          sumSharedTerms += valueA * valueB;
        }
      });

      // Calculate Euclidean distance with the weighted differences
      const distance = Math.sqrt(sumSquaredDiff);
      
      // Hybrid approach: combine distance-based and shared-terms metrics
      const distanceSimilarity = 1 / (1 + distance);
      const sharedTermsFactor = Math.min(1, sumSharedTerms / 10); // Scale shared terms factor
      
      // Combined similarity that considers both distance and shared terms
      let similarity = (distanceSimilarity * 0.5) + (sharedTermsFactor * 0.5);
      
      // Apply boost for having many shared terms
      similarity *= sharedTermBoost;
      
      // Ensure result is between 0 and 1
      similarity = Math.min(1, Math.max(0, similarity));
      
      return similarity;
    } catch (error) {
      console.error('Error calculating Euclidean similarity:', error);
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

  // Get recommendations based on user input - similar to original but using Euclidean similarity
  async getRecommendations(userInputData, options = {}) {
    try {
      console.log("Starting Euclidean-based recommendation process");
      
      const {
        maxResults = 9,
        similarityThreshold = 0.05, // Euclidean may require a different threshold
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
          
          // Calculate similarity using Euclidean distance
          const similarity = this.calculateEuclideanSimilarity(userVector, movie.vector);
          
          // Log the movie name and similarity
          console.log(`Euclidean Similarity for "${movie.movieName}": ${similarity.toFixed(4)}`);
          
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
      console.log("\nTop recommendations using Euclidean similarity:");
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

      console.log("Euclidean-based recommendation process complete.");
      return formattedResults;
    } catch (error) {
      console.error('Error getting recommendations with Euclidean similarity:', error);
      throw error;
    }
  }
}

export default EuclideanDistanceRecommender;
