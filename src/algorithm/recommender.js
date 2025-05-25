import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';
import movieDatabaseService from '../lib/db/services/MovieDatabaseService.js';
import FeedbackUtils from './feedbackUtils.js';
import { generateUserPreferenceVector } from './userPreferenceAnalyzer.js';
import { compareGenreVectors } from './vectorComparison.js';
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

  // Apply additional weights based on movie metadata
  applyMetadataWeights(similarity, movie, userPreferences) {
    let weightedScore = similarity;

    // Title matching boost: Check if any of the movie titles match
    if (movie?.movieName && userPreferences?.movieTitles && Array.isArray(userPreferences.movieTitles)) {
      const movieTitle = movie.movieName.toLowerCase();

      // Check each movie title identified by the LLM
      for (const title of userPreferences.movieTitles) {
        const titleLower = title.toLowerCase();

        // Exact match (case insensitive)
        if (movieTitle === titleLower) {
          weightedScore *= 1.3;
          break;
        }

        // Partial matches
        if (movieTitle.includes(titleLower) || titleLower.includes(movieTitle)) {
          weightedScore *= 1.1;
          break;
        }

        // Check for multi-word matches
        const movieTitleWords = movieTitle.split(/\s+/);
        const titleWords = titleLower.split(/\s+/);

        // Count matching words
        let matchCount = 0;
        for (const movieWord of movieTitleWords) {
          if (movieWord.length > 3 && titleWords.includes(movieWord)) {
            matchCount++;
          }
        }

        // If multiple words match, apply a boost
        if (matchCount > 1) {
          const matchRatio = matchCount / Math.max(movieTitleWords.length, titleWords.length);
          weightedScore *= (1.0 + matchRatio * 1.3); // Up to 3x boost
          break;
        }
      }
    }

    // Weight by release recency (if available)
    if (movie?.releaseYear && userPreferences?.preferNewReleases) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - movie.releaseYear;
      const recencyBoost = 1 + (Math.max(0, 1 - (age / 10)) * 0.3);
      weightedScore *= recencyBoost;
    }

    // Weight by popularity (if available)
    if (movie?.popularity) {
      const popularityBoost = 1 + (movie.popularity * 0.2);
      weightedScore *= popularityBoost;
    }

    // Duration preference adjustment
    if (userPreferences?.preferredDuration && movie?.duration) {
      const durationDiff = Math.abs(userPreferences.preferredDuration - movie.duration);
      const durationFactor = 1 + (Math.max(0, 1 - (durationDiff / 60)) * 0.1);
      weightedScore *= durationFactor;
    }

    // Check for excluded genres - immediately set score to 0 if any genre matches an excluded genre
    if (userPreferences?.excludedGenres && userPreferences.excludedGenres.length > 0 && movie?.genres) {
      // Check if any movie genre is in the excluded list
      const hasExcludedGenre = movie.genres.some(genre =>
        userPreferences.excludedGenres.includes(genre)
      );

      if (hasExcludedGenre) {
        return 0; // Completely exclude this movie from recommendations
      }
    }

    // Genre matching (if user has preferred genres)
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


  async compareMoviesWithUserPreferences() {

  }

  // Get recommendations based on user input
  async getRecommendations(userInputData, options = {}) {
    try {
      const {
        maxResults = 6,
        similarityThreshold = 0.03,
        includeMetadata = true,
        preferredGenres = [],
        useFeedbackData = true
      } = options;

      // Process user input into vector
      let userVector;
      let userPreferences;
      // Check if the input is already processed (has vector property)

      // Process user input into vector if it's not already processed
      const processedData = userInputData?.processedData || await this.userProcessor.processUserInput(userInputData);
      const preferenceVector = await generateUserPreferenceVector(userInputData.freeText);
      userVector = processedData.vector;
      userPreferences = processedData.processedInput.preferences;

      // Add movie titles identified by the LLM to user preferences
      if (processedData.processedInput?.movieTitles) {
        userPreferences.movieTitles = processedData.processedInput.movieTitles;
      }


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


      // Calculate similarity scores
      const results = [];
      for (const [movieId, movieData] of Object.entries(movieVectors)) {
        if (!movieData.vector) continue;

        const similarity = this.calculateCosineSimilarity(userVector, movieData.vector);
        const comparisonResults = compareGenreVectors(preferenceVector, movieData.genreVector).similarityScore;
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
        weightedScore = weightedScore * 0.7 + comparisonResults * 0.3;
        console.log(weightedScore)
        // Only include movies above the threshold
        if (weightedScore >= similarityThreshold) {
          const result = {
            movieId,
            movieName: movieData.movieName || 'Unknown Movie',
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