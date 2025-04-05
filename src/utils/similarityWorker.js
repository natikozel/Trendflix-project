import { parentPort, workerData } from 'worker_threads';

/**
 * Worker thread for calculating similarities in parallel
 * This is run in a separate thread to speed up processing
 */

// Function to calculate similarity for a batch of movies
function calculateSimilarities(userVector, movies, threshold) {
  const results = [];
  
  for (const movie of movies) {
    try {
      if (!movie.vector) continue;
      
      // Calculate dot product and magnitudes
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;
      
      // Calculate using only dimensions from user vector (usually smaller)
      for (const dim in userVector) {
        const a = userVector[dim] || 0;
        const b = movie.vector[dim] || 0;
        
        if (a !== 0 && b !== 0) {
          dotProduct += a * b;
        }
        
        magnitudeA += a * a;
      }
      
      // Calculate magnitude for movie vector
      for (const value of Object.values(movie.vector)) {
        magnitudeB += value * value;
      }
      
      // Calculate final magnitudes
      magnitudeA = Math.sqrt(magnitudeA);
      magnitudeB = Math.sqrt(magnitudeB);
      
      // Skip if either magnitude is zero
      if (magnitudeA === 0 || magnitudeB === 0) {
        continue;
      }
      
      // Calculate similarity
      const similarity = dotProduct / (magnitudeA * magnitudeB);
      
      // Skip if NaN or below threshold
      if (isNaN(similarity) || similarity < threshold) {
        continue;
      }
      
      // Add to results
      results.push({
        movieId: movie.movieId,
        movieName: movie.movieName,
        similarity: similarity,
        movie: {
          movieId: movie.movieId,
          movieName: movie.movieName,
          rating: movie.rating,
          releaseYear: movie.releaseYear,
          duration: movie.duration,
          genres: movie.genres,
          posterUrl: movie.posterUrl
        }
      });
    } catch (error) {
      // Ignore errors in worker
    }
  }
  
  return results;
}

// Extract data passed to worker
const { userVector, movies, threshold } = workerData;

// Process the batch and return results
const results = calculateSimilarities(userVector, movies, threshold);
parentPort.postMessage(results); 