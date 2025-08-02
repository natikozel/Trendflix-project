/**
 * Movie Recommendation Engine
 * 
 * This module implements a hybrid recommendation system that combines:
 * 1. Content-based filtering using TF-IDF vectorization of movie reviews
 * 2. Collaborative filtering through user feedback analysis
 * 3. Metadata-based filtering using movie attributes (genre, year, duration, etc.)
 * 4. LLM-enhanced preference extraction from natural language input
 * 
 * The algorithm works in the following steps:
 * 1. Convert user input (text + preferences) into a high-dimensional vector
 * 2. Compare user vector with pre-computed movie review vectors using cosine similarity
 * 3. Apply metadata-based weights to refine recommendations
 * 4. Incorporate historical user feedback to improve future recommendations
 * 5. Return ranked list of most similar movies
 * 
 * @author Trendflix Team
 * @version 1.0.0
 */

import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';
import FeedbackUtils from './feedbackUtils.js';

/**
 * Main recommendation engine class
 * 
 * This class orchestrates the entire recommendation process by:
 * - Processing user input into meaningful vectors
 * - Computing similarity scores between user preferences and movies
 * - Applying various weighting factors based on metadata
 * - Incorporating user feedback to improve recommendations
 * - Returning personalized movie suggestions
 */
class Recommender {
  constructor() {
    this.vectorProcessor = new VectorProcessor();
    this.userProcessor = new UserInputProcessor();
  }

  /**
   * Calculate cosine similarity between two vectors
   * 
   * Cosine similarity measures the cosine of the angle between two vectors,
   * providing a value between -1 and 1, where 1 indicates perfect similarity.
   * This is the core similarity metric used in our recommendation system.
   * 
   * @param {Map|Object} vectorA - First vector (can be Map or plain object)
   * @param {Map|Object} vectorB - Second vector (can be Map or plain object)
   * @returns {number} - Similarity score between 0 and 1 (0 = no similarity, 1 = identical)
   */
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
      
      // Get all unique dimensions from both vectors
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

      // Calculate dot product and magnitudes for cosine similarity
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;

      dimensions.forEach(dim => {
        const a = getValue(vectorA, isMapA, dim);
        const b = getValue(vectorB, isMapB, dim);
        
        // Check for valid numbers
        if (isNaN(a) || isNaN(b)) {
          return; // Skip this dimension
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
    } catch (err) {
      console.error('Error calculating similarity:', err);
      return 0;
    }
  }

  /**
   * Apply metadata-based weights to refine similarity scores
   * 
   * This method implements a multi-factor weighting system that considers:
   * - Movie title matching (exact, partial, and word-level matches)
   * - Release year preferences and recency bias
   * - Popularity scores
   * - Duration preferences
   * - Genre preferences and exclusions
   * - Age-appropriate content filtering
   * 
   * The weights are multiplicative, allowing for fine-grained control over
   * recommendation relevance while maintaining the base similarity score.
   * 
   * @param {number} similarity - Base cosine similarity score
   * @param {Object} movie - Movie metadata object
   * @param {Object} userPreferences - User preference object
   * @returns {number} - Weighted similarity score
   */
  applyMetadataWeights(similarity, movie, userPreferences) {
    let weightedScore = similarity;
    
    // Title matching boost: Check if any of the movie titles match
    // This leverages LLM-extracted movie titles from user text input
    if (movie?.movieName && userPreferences?.movieTitles && Array.isArray(userPreferences.movieTitles)) {
      const movieTitle = movie.movieName.toLowerCase();
      
      // Check each movie title identified by the LLM
      for (const title of userPreferences.movieTitles) {
        const titleLower = title.toLowerCase();
        
        // Exact match (case insensitive) - strongest boost
        if (movieTitle === titleLower) {
          weightedScore *= 1.3;
          break;
        }
        
        // Partial matches - moderate boost
        if (movieTitle.includes(titleLower) || titleLower.includes(movieTitle)) {
          weightedScore *= 1.1;
          break;
        }
        
        // Multi-word matches - calculate word-level similarity
        const movieTitleWords = movieTitle.split(/\s+/);
        const titleWords = titleLower.split(/\s+/);
        
        // Count matching words (only significant words > 3 characters)
        let matchCount = 0;
        for (const movieWord of movieTitleWords) {
          if (movieWord.length > 3 && titleWords.includes(movieWord)) {
            matchCount++;
          }
        }
        
        // If multiple words match, apply proportional boost
        if (matchCount > 1) {
          const matchRatio = matchCount / Math.max(movieTitleWords.length, titleWords.length);
          weightedScore *= (1.0 + matchRatio * 1.3); // Up to 2.3x boost
          break;
        }
      }
    }

    // Recency bias: Prefer newer movies if user indicates preference
    if (movie?.releaseYear && userPreferences?.preferNewReleases) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - movie.releaseYear;
      // Exponential decay: newer movies get higher boost
      const recencyBoost = 1 + (Math.max(0, 1 - (age / 10)) * 0.3);
      weightedScore *= recencyBoost;
    }

    // Popularity boost: Leverage crowd wisdom
    if (movie?.popularity) {
      const popularityBoost = 1 + (movie.popularity * 0.2);
      weightedScore *= popularityBoost;
    }

    // Duration preference: Match user's preferred movie length
    if (userPreferences?.preferredDuration && movie?.duration) {
      const durationDiff = Math.abs(userPreferences.preferredDuration - movie.duration);
      // Linear decay: closer duration = higher score
      const durationFactor = 1 + (Math.max(0, 1 - (durationDiff / 60)) * 0.1);
      weightedScore *= durationFactor;
    }

    // Genre exclusion: Hard filter for disliked genres
    if (userPreferences?.excludedGenres && userPreferences.excludedGenres.length > 0 && movie?.genres) {
      // Check if any movie genre is in the excluded list
      const hasExcludedGenre = movie.genres.some(genre => 
        userPreferences.excludedGenres.includes(genre)
      );
      
      if (hasExcludedGenre) {
        return 0; // Completely exclude this movie from recommendations
      }
    }

    // Genre preference: Boost movies with preferred genres
    if (userPreferences?.preferredGenres && userPreferences?.preferredGenres?.length > 0 && movie?.genres) {
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

    // Year range preference: Prefer movies within specified year range
    if (userPreferences?.yearRange?.minYear && userPreferences?.yearRange?.maxYear && movie?.releaseYear) {
      // First check if the movie is within the range
      const isInRange = movie.releaseYear >= userPreferences.yearRange.minYear && 
                        movie.releaseYear <= userPreferences.yearRange.maxYear;
      
      if (isInRange) {
        // Calculate how well the movie's year fits in the range (closer to middle = better)
        const rangeSize = userPreferences.yearRange.maxYear - userPreferences.yearRange.minYear;
        const midPoint = (userPreferences.yearRange.minYear + userPreferences.yearRange.maxYear) / 2;
        const distanceFromMidpoint = Math.abs(movie.releaseYear - midPoint);
        
        // Normalize distance from midpoint (0 = at midpoint, 1 = at edge of range)
        const normalizedDistance = distanceFromMidpoint / (rangeSize / 2);
        
        // Calculate boost (max boost at midpoint, decreasing toward edges)
        const yearBoost = 1 + (1 - normalizedDistance) * 0.7;
        weightedScore *= yearBoost;
      } else {
        // Movie is outside the range - apply a penalty based on how far outside
        const distanceOutsideRange = Math.min(
          Math.abs(movie.releaseYear - userPreferences.yearRange.minYear),
          Math.abs(movie.releaseYear - userPreferences.yearRange.maxYear)
        );
        
        // Stronger penalty for movies further outside the range
        const penaltyFactor = Math.max(0.5, 1 - (distanceOutsideRange / 10) * 0.5);
        
        weightedScore *= penaltyFactor;
      }
    }

    // Age-appropriate content filtering
    if (userPreferences?.age && movie?.ageRating) {
      const ageRatingOrder = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
      const movieAgeRatingIndex = ageRatingOrder.indexOf(movie.ageRating);
      const userAge = parseInt(userPreferences.age);
      
      // Map user age to appropriate rating
      let maxAllowedRatingIndex;
      if (userAge < 13) {
        maxAllowedRatingIndex = 1; // Up to PG
      } else if (userAge < 17) {
        maxAllowedRatingIndex = 2; // Up to PG-13
      } else {
        maxAllowedRatingIndex = 4; // All ratings allowed
      }
      
      // If movie rating is higher than allowed for user's age, set score to 0
      if (movieAgeRatingIndex > maxAllowedRatingIndex) {
        weightedScore = 0;
      }
    }

    return weightedScore;
  }

  /**
   * Generate personalized movie recommendations
   * 
   * This is the main entry point for the recommendation system. It:
   * 1. Processes user input into a vector representation
   * 2. Retrieves movie vectors from the database
   * 3. Computes similarity scores using cosine similarity
   * 4. Applies metadata-based weights
   * 5. Incorporates user feedback data
   * 6. Returns ranked recommendations
   * 
   * @param {Object} userInputData - User's input (text + preferences)
   * @param {Object} options - Configuration options
   * @param {number} options.maxResults - Maximum number of recommendations (default: 6)
   * @param {number} options.similarityThreshold - Minimum similarity score (default: 0.03)
   * @param {boolean} options.includeMetadata - Include movie metadata in results (default: true)
   * @param {Array} options.preferredGenres - Genre filter for initial movie selection
   * @param {boolean} options.useFeedbackData - Use feedback to improve recommendations (default: true)
   * @returns {Promise<Array>} - Array of recommended movies with scores
   */
  async getRecommendations(userInputData) {
    try {      
      const maxResults = 6;
      const similarityThreshold = 0.03;
      const includeMetadata = true;
      const preferredGenres = [];
      const useFeedbackData = false;

      // Process user input into vector
      let userVector;
      let userPreferences;
      
      // Check if the input is already processed (has vector property)
      if (userInputData.processedData.vector) {
        userVector = userInputData.processedData.vector;
        userPreferences = userInputData.processedData.processedInput?.preferences || {};
      } else {
        // Process user input into vector if it's not already processed
        const processedData = await this.userProcessor.processUserInput(userInputData);
        userVector = processedData.vector;
        userPreferences = processedData.processedInput.preferences;
        
        // Add movie titles identified by the LLM to user preferences
        if (processedData.processedInput?.movieTitles) {
          userPreferences.movieTitles = processedData.processedInput.movieTitles;
        }
      }

      // Merge explicit user preferences with processed preferences
      if (userInputData?.genres) {
        userPreferences.preferredGenres = userInputData.genres;
      }
      if (userInputData?.excludedGenres) {
        userPreferences.excludedGenres = userInputData.excludedGenres;
      }
      if (userInputData?.age) {
        userPreferences.age = userInputData.age;
      }
      if (userInputData?.gender) {
        userPreferences.gender = userInputData.gender;
      }

      // Initialize the database connection
      await movieDatabaseService.initialize();
      
      // Get vectorized movies from the database
      const hasGenrePreferences = preferredGenres && preferredGenres.length > 0;
      
      const movieVectors = await movieDatabaseService.getMovieVectors(
        hasGenrePreferences ? preferredGenres : null
      );
      
      // Calculate similarity scores for all movies
      const results = [];
      for (const [movieId, movieData] of Object.entries(movieVectors)) {
        if (!movieData.vector) continue;
        
        // Calculate base similarity using cosine similarity
        const similarity = this.calculateCosineSimilarity(userVector, movieData.vector);        

        // Apply metadata-based weights
        let weightedScore = this.applyMetadataWeights(similarity, movieData, userPreferences);
        
        // Incorporate feedback data if enabled
        if (useFeedbackData) {
          try {
            // Apply feedback-based adjustment to the score
            weightedScore = await FeedbackUtils.adjustScoreBasedOnFeedback(
              movieId, 
              weightedScore, 
              userPreferences
            );
          } catch (error) {
            console.error("Error applying feedback adjustment:", error);
            // Continue without feedback adjustment if it fails
          }
        }
        
        // Only include movies above the threshold
        if (weightedScore >= similarityThreshold) {
          const result = {
            movieId,
            movieName: movieData.movieName || 'Unknown Movie',
            similarity: similarity.toFixed(4),
            finalScore: weightedScore.toFixed(4)
          };
          
          // Add metadata if requested
          if (includeMetadata) {
            result.metadata = {
              releaseYear: movieData.releaseYear,
              duration: movieData.duration,
              popularity: movieData.rating,
              posterUrl: movieData.posterUrl,
              genres: movieData.genres
            };
          }
          
          results.push(result);
        }
      }
      
      // Sort by final weighted score (descending)
      results.sort((a, b) => parseFloat(b.finalScore) - parseFloat(a.finalScore));
      
      // Take top N results
      return results.slice(0, maxResults);
      
    } catch (error) {
      console.error("Error in recommendation process:", error);
      throw error;
    }
  }
}

export default Recommender;