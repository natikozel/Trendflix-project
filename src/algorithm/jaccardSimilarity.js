/**
 * Jaccard Similarity Recommender
 * 
 * This recommender uses Jaccard similarity to compare user preferences with movies.
 * Jaccard similarity measures similarity between finite sample sets by calculating
 * the size of intersection divided by the size of union of the sample sets.
 * 
 * It works well for sparse binary vectors and focuses on the presence/absence of terms
 * rather than their weights. This makes it useful for categorical data and can provide
 * more intuitive similarity scores for UI displays.
 */

import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';

class JaccardSimilarityRecommender {
  constructor() {
    this.vectorProcessor = new VectorProcessor();
    this.userProcessor = new UserInputProcessor();
  }

  // Calculate Jaccard similarity between two vectors
  calculateJaccardSimilarity(vectorA, vectorB) {
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
      
      // Get all dimensions
      const dimensions = new Set();
      
      if (isMapA) {
        for (const key of vectorA.keys()) {
          dimensions.add(key);
        }
      } else {
        Object.keys(vectorA).forEach(key => dimensions.add(key));
      }
      
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

      // For weighted Jaccard, we'll use the actual values rather than just presence/absence
      let intersection = 0;
      let union = 0;
      let sharedDimensionsCount = 0;
      let dotProduct = 0; // Add cosine-like component

      dimensions.forEach(dim => {
        const valueA = getValue(vectorA, isMapA, dim);
        const valueB = getValue(vectorB, isMapB, dim);
        
        if (isNaN(valueA) || isNaN(valueB)) {
          return;
        }
        
        // Weighted intersection is min of two values
        const minVal = Math.min(valueA, valueB);
        
        // Weighted union is max of two values
        const maxVal = Math.max(valueA, valueB);
        
        // Add to running totals
        intersection += minVal;
        union += maxVal;
        
        // Track shared dimensions with non-zero values
        if (valueA > 0 && valueB > 0) {
          sharedDimensionsCount++;
          dotProduct += valueA * valueB; // Add dot product for cosine-like component
        }
      });

      // Calculate Jaccard similarity with safety check
      if (union === 0) {
        return 0;
      }
      
      // Base Jaccard similarity 
      let similarity = intersection / union;
      
      // Add a scaled boost based on the number of shared dimensions with non-zero values
      const sharedDimensionsBoost = Math.sqrt(sharedDimensionsCount) * 0.1;
      similarity = similarity + sharedDimensionsBoost;
      
      // Incorporate a bit of cosine-like behavior for better semantic matching
      if (dotProduct > 0) {
        // This gently pulls the score toward cosine-like behavior
        const cosineComponent = Math.min(0.3, dotProduct / 10);
        similarity = (similarity * 0.7) + cosineComponent;
      }
      
      // Scale to make values more usable for UI and ensure they're between 0 and 1
      similarity = Math.min(1, Math.max(0, similarity * 2.0));
      
      return similarity;
    } catch (error) {
      console.error('Error calculating Jaccard similarity:', error);
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

  // Get recommendations based on user input - similar to original but using Jaccard similarity
  async getRecommendations(userInputData, options = {}) {
    try {
      console.log("Starting Jaccard-based recommendation process");
      
      const {
        maxResults = 9,
        similarityThreshold = 0.03, // Jaccard requires a different threshold
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
          
          // Calculate similarity using Jaccard
          const similarity = this.calculateJaccardSimilarity(userVector, movie.vector);
          
          // Log the movie name and similarity
          console.log(`Jaccard Similarity for "${movie.movieName}": ${similarity.toFixed(4)}`);
          
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
      console.log("\nTop recommendations using Jaccard similarity:");
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

      console.log("Jaccard-based recommendation process complete.");
      return formattedResults;
    } catch (error) {
      console.error('Error getting recommendations with Jaccard similarity:', error);
      throw error;
    }
  }
}

export default JaccardSimilarityRecommender;