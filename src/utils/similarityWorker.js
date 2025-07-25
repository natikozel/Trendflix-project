import { parentPort, workerData } from 'worker_threads';

function calculateSimilarities(userVector, movies, threshold) {
  const results = [];
  
  for (const movie of movies) {
    try {
      if (!movie.vector) continue;
      
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;
      
      for (const dim in userVector) {
        const a = userVector[dim] || 0;
        const b = movie.vector[dim] || 0;
        
        if (a !== 0 && b !== 0) {
          dotProduct += a * b;
        }
        
        magnitudeA += a * a;
      }
      
      for (const value of Object.values(movie.vector)) {
        magnitudeB += value * value;
      }
      
      magnitudeA = Math.sqrt(magnitudeA);
      magnitudeB = Math.sqrt(magnitudeB);
      
      if (magnitudeA === 0 || magnitudeB === 0) {
        continue;
      }
      
      const similarity = dotProduct / (magnitudeA * magnitudeB);
      
      if (isNaN(similarity) || similarity < threshold) {
        continue;
      }
      
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

const { userVector, movies, threshold } = workerData;

const results = calculateSimilarities(userVector, movies, threshold);
parentPort.postMessage(results);