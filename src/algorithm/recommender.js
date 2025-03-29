import VectorProcessor from './movieReviewsToVector.js';
import UserInputProcessor from './userInputToVector.js';

class Recommender {
  constructor() {
    this.vectorProcessor = new VectorProcessor();
    this.userProcessor = new UserInputProcessor();
    console.log("Recommender initialized");
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
    
    console.log(`Vector magnitudes: A=${magnitudeA.toFixed(4)}, B=${magnitudeB.toFixed(4)}`);

    // Return cosine similarity
    if (magnitudeA === 0 || magnitudeB === 0) {
      console.log("Warning: Zero magnitude detected, returning similarity of 0");
      return 0; // Avoid division by zero
    }
    
    const similarity = dotProduct / (magnitudeA * magnitudeB);
    console.log(`Calculated similarity: ${similarity.toFixed(4)}`);
    return similarity;
  }

  // Apply additional weights based on movie metadata
  applyMetadataWeights(similarity, movie, userPreferences) {
    console.log(`Applying metadata weights for movie: ${movie.movie_name || 'Unknown'}`);
    console.log(`Base similarity: ${similarity.toFixed(4)}`);
    
    let weightedScore = similarity;

    // Weight by IMDb rating (assuming 10-point scale)
    if (movie.imdbRating) {
      const ratingBoost = 1 + (movie.imdbRating / 20);
      weightedScore *= ratingBoost;
      console.log(`Applied IMDb rating boost (${movie.imdbRating}): ${ratingBoost.toFixed(2)}x -> ${weightedScore.toFixed(4)}`);
    }

    // Weight by release recency (if available)
    if (movie.releaseYear && userPreferences.preferNewReleases) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - movie.releaseYear;
      const recencyBoost = 1 + (Math.max(0, 1 - (age / 10)) * 0.3);
      weightedScore *= recencyBoost;
      console.log(`Applied recency boost (${movie.releaseYear}): ${recencyBoost.toFixed(2)}x -> ${weightedScore.toFixed(4)}`);
    }

    // Weight by popularity trends (if available)
    if (movie.popularityScore) {
      const popularityBoost = 1 + (movie.popularityScore * 0.2);
      weightedScore *= popularityBoost;
      console.log(`Applied popularity boost (${movie.popularityScore}): ${popularityBoost.toFixed(2)}x -> ${weightedScore.toFixed(4)}`);
    }

    // Duration preference adjustment
    if (userPreferences.preferredDuration && movie.duration) {
      const durationDiff = Math.abs(userPreferences.preferredDuration - movie.duration);
      const durationFactor = 1 + (Math.max(0, 1 - (durationDiff / 60)) * 0.1);
      weightedScore *= durationFactor;
      console.log(`Applied duration adjustment (user: ${userPreferences.preferredDuration}min, movie: ${movie.duration}min): ${durationFactor.toFixed(2)}x -> ${weightedScore.toFixed(4)}`);
    }

    console.log(`Final weighted score: ${weightedScore.toFixed(4)}`);
    return weightedScore;
  }

  // Get recommendations based on user input
  async getRecommendations(userInputData, movieDatabase, options) {
    try {
      console.log("Starting recommendation process");
      console.log(`Received movieDatabase with ${movieDatabase.length} movies`);
      
      const {
        maxResults = 5,
        similarityThreshold = 0.1,
        includeMetadata = true
      } = options;
      
      console.log(`Options: maxResults=${maxResults}, similarityThreshold=${similarityThreshold}, includeMetadata=${includeMetadata}`);

      // Handle both raw user input and already processed input
      let userVector;
      let userPreferences;
      
      // Check if the input is already processed (has vector property)
      if (userInputData.vector) {
        console.log("User data already processed, using provided vector");
        userVector = userInputData.vector;
        userPreferences = userInputData.processedInput.preferences;
      } else {
        console.log("Processing raw user input");
        // Process user input into vector if it's not already processed
        const processedData = await this.userProcessor.processUserInput(userInputData);
        userVector = processedData.vector;
        userPreferences = processedData.processedInput.preferences;
      }
      console.log("Processed final user input", userVector)
      console.log(`User vector created with ${Object.keys(userVector).length} dimensions`);
      console.log("User preferences:", JSON.stringify(userPreferences, null, 2));

      // Calculate similarities and apply weights
      console.log("Calculating similarities for each movie...");
      const recommendations = [];
      
      for (let i = 0; i < movieDatabase.length; i++) {
        const movie = movieDatabase[i];
        console.log(`\nProcessing movie ${i+1}/${movieDatabase.length}: ${movie.movie_name || movie.movie_id || 'Unknown'}`);
        
        // Check if movie has required properties
        if (!movie.reviews) {
          console.log(`Warning: Movie ${i+1} has no reviews property, skipping`);
          continue;
        }
        
        // Get or process movie vector
        let movieVector;
        try {
          movieVector = movie.vector || this.vectorProcessor.processMovie(movie).vector;
          console.log(`Movie vector created with ${Object.keys(movieVector).length} dimensions`);
        } catch (error) {
          console.error(`Error processing movie vector for movie ${i+1}:`, error.message);
          continue;
        }

        // Calculate base similarity
        let similarity;
        try {
          similarity = this.calculateCosineSimilarity(userVector, movieVector);
        } catch (error) {
          console.error(`Error calculating similarity for movie ${i+1}:`, error.message);
          continue;
        }

        // Apply additional weights if needed
        let finalScore;
        try {
          finalScore = includeMetadata ? 
            this.applyMetadataWeights(similarity, movie, userPreferences) : 
            similarity;
        } catch (error) {
          console.error(`Error applying metadata weights for movie ${i+1}:`, error.message);
          finalScore = similarity;
        }

        recommendations.push({
          movie: movie,
          similarity: similarity,
          finalScore: finalScore
        });
      }

      console.log(`\nCalculated similarities for ${recommendations.length} movies`);

      // Filter and sort recommendations
      const filteredRecommendations = recommendations
        .filter(rec => {
          const isValid = rec.similarity >= similarityThreshold;
          if (!isValid) {
            console.log(`Filtering out ${rec.movie.movie_name || 'Unknown'} with similarity ${rec.similarity.toFixed(4)} (below threshold ${similarityThreshold})`);
          }
          return isValid;
        })
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, maxResults);

      console.log(`\nFiltered to ${filteredRecommendations.length} recommendations above similarity threshold`);

      // Format results
      const formattedResults = filteredRecommendations.map(rec => ({
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

      console.log("Recommendation process complete");
      return formattedResults;

    } catch (error) {
      console.error('Error getting recommendations:', error);
      console.error(error.stack);
      throw error;
    }
  }
}

export default Recommender; 