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

  calculateCosineSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB) {
      return 0;
    }

    try {
      const isMapA = vectorA instanceof Map;
      const isMapB = vectorB instanceof Map;

      const getValue = (vector, isMap, key) => {
        if (isMap) {
          return vector.has(key) ? vector.get(key) : 0;
        } else {
          return vector[key] || 0;
        }
      };

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

      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;

      dimensions.forEach(dim => {
        const a = getValue(vectorA, isMapA, dim);
        const b = getValue(vectorB, isMapB, dim);

        if (isNaN(a) || isNaN(b)) {
          return;
        }

        dotProduct += a * b;
        magnitudeA += a * a;
        magnitudeB += b * b;
      });

      magnitudeA = Math.sqrt(Math.max(0, magnitudeA));
      magnitudeB = Math.sqrt(Math.max(0, magnitudeB));

      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
      }

      const similarity = dotProduct / (magnitudeA * magnitudeB);

      if (isNaN(similarity)) {
        return 0;
      }

      return similarity;
    } catch (err) {
      console.error('Error calculating similarity:', err);
      return 0;
    }
  }

  applyMetadataWeights(similarity, movie, userPreferences) {
    let weightedScore = similarity;

    if (movie?.movieName && userPreferences?.movieTitles && Array.isArray(userPreferences.movieTitles)) {
      const movieTitle = movie.movieName.toLowerCase();

      for (const title of userPreferences.movieTitles) {
        const titleLower = title.toLowerCase();

        if (movieTitle === titleLower) {
          weightedScore *= 1.3;
          break;
        }

        if (movieTitle.includes(titleLower) || titleLower.includes(movieTitle)) {
          weightedScore *= 1.1;
          break;
        }

        const movieTitleWords = movieTitle.split(/\s+/);
        const titleWords = titleLower.split(/\s+/);

        let matchCount = 0;
        for (const movieWord of movieTitleWords) {
          if (movieWord.length > 3 && titleWords.includes(movieWord)) {
            matchCount++;
          }
        }

        if (matchCount > 1) {
          const matchRatio = matchCount / Math.max(movieTitleWords.length, titleWords.length);
          weightedScore *= (1.0 + matchRatio * 1.3);
          break;
        }
      }
    }

    if (movie?.releaseYear && userPreferences?.preferNewReleases) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - movie.releaseYear;
      const recencyBoost = 1 + (Math.max(0, 1 - (age / 10)) * 0.3);
      weightedScore *= recencyBoost;
    }

    if (movie?.popularity) {
      const popularityBoost = 1 + (movie.popularity * 0.2);
      weightedScore *= popularityBoost;
    }

    if (userPreferences?.preferredDuration && movie?.duration) {
      const durationDiff = Math.abs(userPreferences.preferredDuration - movie.duration);
      const durationFactor = 1 + (Math.max(0, 1 - (durationDiff / 60)) * 0.1);
      weightedScore *= durationFactor;
    }

    if (userPreferences?.excludedGenres && userPreferences.excludedGenres.length > 0 && movie?.genres) {
      const hasExcludedGenre = movie.genres.some(genre =>
        userPreferences.excludedGenres.includes(genre)
      );

      if (hasExcludedGenre) {
        return 0;
      }
    }

    if (userPreferences?.preferredGenres && userPreferences?.preferredGenres?.length > 0 && movie?.genres) {
      const matchingGenres = movie.genres.filter(genre =>
        userPreferences.preferredGenres.includes(genre)
      ).length;

      if (matchingGenres > 0) {
        const genreBoost = 1 + (matchingGenres / userPreferences.preferredGenres.length) * 0.3;
        weightedScore *= genreBoost;
      }
    }

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

  async compareMoviesWithUserPreferences() {

  }

  async getRecommendations(userInputData, options = {}) {
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

      const processedData = userInputData?.processedData || await this.userProcessor.processUserInput(userInputData);
      const preferenceVector = await generateUserPreferenceVector(userInputData.freeText);
      userVector = processedData.vector;
      userPreferences = processedData.processedInput.preferences;

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

      await movieDatabaseService.initialize();

      const hasGenrePreferences = preferredGenres && preferredGenres.length > 0;

      const movieVectors = await movieDatabaseService.getMovieVectors(
        hasGenrePreferences ? preferredGenres : null
      );

      const results = [];
      for (const [movieId, movieData] of Object.entries(movieVectors)) {
        if (!movieData.vector) continue;

        const similarity = this.calculateCosineSimilarity(userVector, movieData.vector);
        const comparisonResults = compareGenreVectors(preferenceVector, movieData.genreVector).similarityScore;
        let weightedScore = this.applyMetadataWeights(similarity, movieData, userPreferences);
        
        if (useFeedbackData) {
          try {
            weightedScore = await FeedbackUtils.adjustScoreBasedOnFeedback(
              movieId,
              weightedScore,
              userPreferences
            );
          } catch (error) {
            console.error("Error applying feedback adjustment:", error);
          }
        }
        weightedScore = weightedScore * 0.7 + comparisonResults * 0.3;
        
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
      }

      results.sort((a, b) => parseFloat(b.finalScore) - parseFloat(a.finalScore));

      return results.slice(0, maxResults);

    } catch (error) {
      console.error("Error in recommendation process:", error);
      throw error;
    }
  }
}

export default Recommender;