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
    const startTime = performance.now();
    
    if (!vectorA || !vectorB) {
      return 0;
    }

    try {
      // Phase 1: Type checking and setup
      const phase1Start = performance.now();
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
        dimensions = new Set(vectorA.keys());
        getValueA = (key) => vectorA.get(key) || 0;
      } else {
        dimensions = new Set(Object.keys(vectorA));
        getValueA = (key) => vectorA[key] || 0;
      }

      if (isMapB) {
        if (isMapA) {
          // Both are Maps - add B's keys to existing set
          for (const key of vectorB.keys()) {
            dimensions.add(key);
          }
        } else {
          // A is Object, B is Map - merge keys
          for (const key of vectorB.keys()) {
            dimensions.add(key);
          }
        }
        getValueB = (key) => vectorB.get(key) || 0;
      } else {
        // B is Object
        Object.keys(vectorB).forEach(key => dimensions.add(key));
        getValueB = (key) => vectorB[key] || 0;
      }

      if (dimensions.size === 0) {
        return 0;
      }

      // Calculate dot product and magnitudes for cosine similarity
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;

      // Use optimized access functions
      for (const dim of dimensions) {
        const a = getValueA(dim);
        const b = getValueB(dim);

        if (!isNaN(a) && !isNaN(b)) {
          dotProduct += a * b;
          magnitudeA += a * a;
          magnitudeB += b * b;
        }
      }
      const phase4Start = performance.now();

      magnitudeA = Math.sqrt(Math.max(0, magnitudeA));
      magnitudeB = Math.sqrt(Math.max(0, magnitudeB));

      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
      }

      const similarity = dotProduct / (magnitudeA * magnitudeB);

      if (isNaN(similarity)) {
        return 0;
      }
      const phase3End = performance.now();

      const phase4End = performance.now();

      const totalTime = performance.now() - startTime;
      
      // Log timing information (you can remove this after debugging)
      // if (totalTime > 1) { // Only log if it takes more than 1ms
        console.log(`Cosine Similarity Timing Breakdown:
          Phase 1 (Setup): ${(phase1End - phase1Start).toFixed(3)}ms
          Phase 2 (Dimensions): ${(phase2End - phase2Start).toFixed(3)}ms  
          Phase 3 (Calculation): ${(phase3End - phase3Start).toFixed(3)}ms
          Phase 4 (Final): ${(phase4End - phase4Start).toFixed(3)}ms
          Total: ${totalTime.toFixed(3)}ms
          Dimensions count: ${dimensions.size}`);
      // }

      return isNaN(similarity) ? 0 : similarity;
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
      const hasExcludedGenre = movie.genres.some(genre =>
        userPreferences.excludedGenres.includes(genre)
      );

      if (hasExcludedGenre) {
        return 0;
      }
    }

    // Genre preference: Boost movies with preferred genres
    if (userPreferences?.preferredGenres && userPreferences?.preferredGenres?.length > 0 && movie?.genres) {
      const matchingGenres = movie.genres.filter(genre =>
        userPreferences.preferredGenres.includes(genre)
      ).length;

      if (matchingGenres > 0) {
        const genreBoost = 1 + (matchingGenres / userPreferences.preferredGenres.length) * 0.3;
        weightedScore *= genreBoost;
      }
    }

    // Year range preference: Prefer movies within specified year range
    if (userPreferences?.yearRange?.minYear && userPreferences?.yearRange?.maxYear && movie?.releaseYear) {
      const isInRange = movie.releaseYear >= userPreferences.yearRange.minYear &&
        movie.releaseYear <= userPreferences.yearRange.maxYear;

      if (isInRange) {
        const rangeSize = userPreferences.yearRange.maxYear - userPreferences.yearRange.minYear;
        const midPoint = (userPreferences.yearRange.minYear + userPreferences.yearRange.maxYear) / 2;
        const distanceFromMidpoint = Math.abs(movie.releaseYear - midPoint);

        const normalizedDistance = distanceFromMidpoint / (rangeSize / 2);

        const yearBoost = 1 + (1 - normalizedDistance) * 0.7;
        weightedScore *= yearBoost;
      } else {
        const distanceOutsideRange = Math.min(
          Math.abs(movie.releaseYear - userPreferences.yearRange.minYear),
          Math.abs(movie.releaseYear - userPreferences.yearRange.maxYear)
        );

        const penaltyFactor = Math.max(0.5, 1 - (distanceOutsideRange / 10) * 0.5);

        weightedScore *= penaltyFactor;
      }
    }

    // Age-appropriate content filtering
    if (userPreferences?.age && movie?.ageRating) {
      const ageRatingOrder = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
      const movieAgeRatingIndex = ageRatingOrder.indexOf(movie.ageRating);
      const userAge = parseInt(userPreferences.age);

      let maxAllowedRatingIndex;
      if (userAge < 13) {
        maxAllowedRatingIndex = 1;
      } else if (userAge < 17) {
        maxAllowedRatingIndex = 2;
      } else {
        maxAllowedRatingIndex = 4;
      }

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
  async getRecommendations(userInputData, options = {}) {
    const overallStartTime = performance.now();
    
    try {
      const {
        maxResults = 6,
        similarityThreshold = 0.03,
        includeMetadata = true,
        preferredGenres = [],
        useFeedbackData = true
      } = options;

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
      const preferencesSetupEnd = performance.now();

      // Timing: Database Initialization
      const dbInitStart = performance.now();
      await movieDatabaseService.initialize();
      const dbInitEnd = performance.now();

      // Timing: Movie Vectors Retrieval
      const movieVectorsStart = performance.now();
      const hasGenrePreferences = preferredGenres && preferredGenres.length > 0;
      const movieVectors = await movieDatabaseService.getMovieVectors(
        hasGenrePreferences ? preferredGenres : null
      );
      
      // Calculate similarity scores for all movies
      const results = [];
      
      // Timing variables for loop internals
      let totalSimilarityTime = 0;
      let totalGenreComparisonTime = 0;
      let totalMetadataWeightsTime = 0;
      let totalFeedbackTime = 0;
      let processedMovieCount = 0;

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
            finalScore: weightedScore.toFixed(4)
          };

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
        
        processedMovieCount++;
      }
      const mainLoopEnd = performance.now();

      // Timing: Final Sorting and Slicing
      const sortingStart = performance.now();
      results.sort((a, b) => parseFloat(b.finalScore) - parseFloat(a.finalScore));
      const finalResults = results.slice(0, maxResults);
      const sortingEnd = performance.now();

      const overallEndTime = performance.now();

      // Comprehensive Timing Report
      console.log(`
🔍 RECOMMENDATION PERFORMANCE BREAKDOWN:
=====================================
📊 Overall Stats:
   • Total Time: ${(overallEndTime - overallStartTime).toFixed(2)}ms
   • Movies Processed: ${processedMovieCount}
   • Results Found: ${results.length}
   • Final Results: ${finalResults.length}

⏱️  Phase Breakdown:
   1. User Input Processing: ${(userProcessingEnd - userProcessingStart).toFixed(2)}ms
   2. Preference Vector Generation: ${(preferenceVectorEnd - preferenceVectorStart).toFixed(2)}ms  
   3. Preferences Setup: ${(preferencesSetupEnd - preferencesSetupStart).toFixed(2)}ms
   4. Database Initialization: ${(dbInitEnd - dbInitStart).toFixed(2)}ms
   5. Movie Vectors Retrieval: ${(movieVectorsEnd - movieVectorsStart).toFixed(2)}ms
   6. Main Processing Loop: ${(mainLoopEnd - mainLoopStart).toFixed(2)}ms
   7. Final Sorting: ${(sortingEnd - sortingStart).toFixed(2)}ms

🔄 Loop Internals (Total for ${processedMovieCount} movies):
   • Cosine Similarity: ${totalSimilarityTime.toFixed(2)}ms (avg: ${(totalSimilarityTime/processedMovieCount).toFixed(3)}ms per movie)
   • Genre Comparison: ${totalGenreComparisonTime.toFixed(2)}ms (avg: ${(totalGenreComparisonTime/processedMovieCount).toFixed(3)}ms per movie)
   • Metadata Weights: ${totalMetadataWeightsTime.toFixed(2)}ms (avg: ${(totalMetadataWeightsTime/processedMovieCount).toFixed(3)}ms per movie)
   • Feedback Adjustment: ${totalFeedbackTime.toFixed(2)}ms (avg: ${(totalFeedbackTime/processedMovieCount).toFixed(3)}ms per movie)

📈 Performance Insights:
   • Loop Processing Rate: ${(processedMovieCount / (mainLoopEnd - mainLoopStart) * 1000).toFixed(0)} movies/second
   • Biggest Bottleneck: ${this.identifyBottleneck({
     userProcessing: userProcessingEnd - userProcessingStart,
     preferenceVector: preferenceVectorEnd - preferenceVectorStart,
     dbInit: dbInitEnd - dbInitStart,
     movieVectors: movieVectorsEnd - movieVectorsStart,
     mainLoop: mainLoopEnd - mainLoopStart,
     sorting: sortingEnd - sortingStart
   })}
`);

      return finalResults;

    } catch (error) {
      const overallEndTime = performance.now();
      console.error(`Error in recommendation process (${(overallEndTime - overallStartTime).toFixed(2)}ms):`, error);
      throw error;
    }
  }

  // Helper method to identify the biggest bottleneck
  identifyBottleneck(timings) {
    const phases = Object.entries(timings);
    const slowest = phases.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    return `${slowest[0]} (${slowest[1].toFixed(2)}ms)`;
  }
}

export default Recommender;