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
    const startTime = performance.now();
    
    if (!vectorA || !vectorB) {
      return 0;
    }

    try {
      // Phase 1: Type checking and setup
      const phase1Start = performance.now();
      const isMapA = vectorA instanceof Map;
      const isMapB = vectorB instanceof Map;

      const phase1End = performance.now();
      const phase2Start = performance.now();

      // Pre-optimize access patterns based on vector types
      let dimensions;
      let getValueA, getValueB;

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

      const phase2End = performance.now();
      const phase3Start = performance.now();


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

      // Timing: User Input Processing
      const userProcessingStart = performance.now();
      const processedData = userInputData?.processedData || await this.userProcessor.processUserInput(userInputData);
      const userProcessingEnd = performance.now();

      // Timing: Preference Vector Generation  
      const preferenceVectorStart = performance.now();
      const preferenceVector = await generateUserPreferenceVector(userInputData.freeText);
      const preferenceVectorEnd = performance.now();

      userVector = processedData.vector;
      userPreferences = processedData.processedInput.preferences;

      // User preferences setup
      const preferencesSetupStart = performance.now();
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
      const movieVectorsEnd = performance.now();

      const movieCount = Object.keys(movieVectors).length;
      console.log(`Processing ${movieCount} movies`);

      // Timing: Main Processing Loop
      const mainLoopStart = performance.now();
      const results = [];
      
      // Timing variables for loop internals
      let totalSimilarityTime = 0;
      let totalGenreComparisonTime = 0;
      let totalMetadataWeightsTime = 0;
      let totalFeedbackTime = 0;
      let processedMovieCount = 0;

      for (const [movieId, movieData] of Object.entries(movieVectors)) {
        if (!movieData.vector) continue;

        // Timing: Cosine Similarity
        const similarityStart = performance.now();
        const similarity = this.calculateCosineSimilarity(userVector, movieData.vector);
        const similarityEnd = performance.now();
        totalSimilarityTime += (similarityEnd - similarityStart);

        // Timing: Genre Vector Comparison
        const genreComparisonStart = performance.now();
        const comparisonResults = compareGenreVectors(preferenceVector, movieData.genreVector).similarityScore;
        const genreComparisonEnd = performance.now();
        totalGenreComparisonTime += (genreComparisonEnd - genreComparisonStart);

        // Timing: Metadata Weights
        const metadataStart = performance.now();
        let weightedScore = this.applyMetadataWeights(similarity, movieData, userPreferences);
        const metadataEnd = performance.now();
        totalMetadataWeightsTime += (metadataEnd - metadataStart);

        // Timing: Feedback Adjustment
        const feedbackStart = performance.now();
        // if (useFeedbackData) {
        //   try {
        //     weightedScore = await FeedbackUtils.adjustScoreBasedOnFeedback(
        //       movieId,
        //       weightedScore,
        //       userPreferences
        //     );
        //   } catch (error) {
        //     console.error("Error applying feedback adjustment:", error);
        //   }
        // }
        const feedbackEnd = performance.now();
        totalFeedbackTime += (feedbackEnd - feedbackStart);

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