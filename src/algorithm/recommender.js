import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';

class Recommender {
  constructor() {
    this.vectorProcessor = new VectorProcessor();
    this.userProcessor = new UserInputProcessor();
  }

  // Calculate cosine similarity between two vectors
  calculateCosineSimilarity(vectorA, vectorB) {
    // Get all unique dimensions
    const dimensions = new Set([
      ...Object.keys(vectorA),
      ...Object.keys(vectorB)
    ]);

    // Calculate dot product
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    dimensions.forEach(dim => {
      const a = vectorA[dim] || 0;
      const b = vectorB[dim] || 0;
      dotProduct += a * b;
      magnitudeA += a * a;
      magnitudeB += b * b;
    });

    // Calculate magnitudes
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    // Return cosine similarity
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Apply additional weights based on movie metadata
  applyMetadataWeights(similarity, movie, userPreferences) {
    let weightedScore = similarity;

    // Weight by IMDb rating (assuming 10-point scale)
    if (movie.imdbRating) {
      weightedScore *= (1 + (movie.imdbRating / 20)); // Max 50% boost for perfect rating
    }

    // Weight by release recency (if available)
    if (movie.releaseYear && userPreferences.preferNewReleases) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - movie.releaseYear;
      const recencyBoost = Math.max(0, 1 - (age / 10)); // Max 100% boost for new releases
      weightedScore *= (1 + (recencyBoost * 0.3)); // 30% max boost for recency
    }

    // Weight by popularity trends (if available)
    if (movie.popularityScore) {
      weightedScore *= (1 + (movie.popularityScore * 0.2)); // Max 20% boost for trending
    }

    // Duration preference adjustment
    if (userPreferences.preferredDuration && movie.duration) {
      const durationDiff = Math.abs(userPreferences.preferredDuration - movie.duration);
      const durationPenalty = Math.max(0, 1 - (durationDiff / 60)); // Penalty increases with duration difference
      weightedScore *= (1 + (durationPenalty * 0.1)); // 10% max adjustment for duration
    }

    return weightedScore;
  }

  // Get recommendations based on user input
  async getRecommendations(userInput, movieDatabase, options) {
    try {
      const {
        maxResults,
        similarityThreshold ,
        includeMetadata
      } = options;

      // Process user input into vector
      const userVector = this.userProcessor.processUserInput(userInput).vector;

      // Calculate similarities and apply weights
      const recommendations = movieDatabase.map(movie => {
        // Get or process movie vector
        const movieVector = movie.vector || 
          this.vectorProcessor.processMovie(movie).vector;

        // Calculate base similarity
        const similarity = this.calculateCosineSimilarity(userVector, movieVector);

        // Apply additional weights if needed
        const finalScore = includeMetadata ? 
          this.applyMetadataWeights(similarity, movie, userInput) : 
          similarity;

        return {
          movie: movie,
          similarity: similarity,
          finalScore: finalScore
        };
      });

      // Filter and sort recommendations
      const filteredRecommendations = recommendations
        .filter(rec => rec.similarity >= similarityThreshold)
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, maxResults);

      // Format results
      return filteredRecommendations.map(rec => ({
        movieId: rec.movie.movie_id,
        movieName: rec.movie.movie_name,
        similarity: rec.similarity.toFixed(4),
        finalScore: rec.finalScore.toFixed(4),
        metadata: includeMetadata ? {
          imdbRating: rec.movie.imdbRating,
          releaseYear: rec.movie.releaseYear,
          duration: rec.movie.duration,
          popularityScore: rec.movie.popularityScore
        } : undefined
      }));

    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
}



export default Recommender; 