/**
 * Utilities to process and normalize movie data
 */

/**
 * Normalize the movie data structure to ensure consistent fields
 */
export function normalizeMovieData(movieData, filename = '') {
  if (!movieData) {
    throw new Error('Invalid movie data: undefined or null');
  }
  
  const normalized = { ...movieData };
  
  // Ensure movie has an ID
  if (!normalized.movie_id) {
    // Try to generate an ID from the filename if missing
    if (filename) {
      const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      normalized.movie_id = filenameWithoutExt;
    } else {
      normalized.movie_id = `movie_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  }
  
  // Ensure movie has a name
  if (!normalized.movie_name) {
    // Use movie_id as fallback
    normalized.movie_name = normalized.movie_id;
  }
  
  // Normalize field names (handle camelCase vs snake_case)
  normalized.releaseYear = normalized.release_year || normalized.releaseYear;
  normalized.posterUrl = normalized.poster_url || normalized.posterUrl;
  normalized.ageRating = normalized.age_rating || normalized.ageRating || null;
  
  // Ensure arrays exist
  normalized.genres = Array.isArray(normalized.genres) ? normalized.genres : [];
  
  // Normalize reviews
  if (Array.isArray(normalized.reviews)) {
    normalized.reviews = normalized.reviews.map(review => {
      // If review is just a string, convert it to object format
      if (typeof review === 'string') {
        return { text: review, author: 'Anonymous' };
      }
      
      // If review is already an object, ensure proper format
      if (review && typeof review === 'object') {
        return {
          text: review.text || review.content || '',
          author: review.author || review.reviewer || 'Anonymous'
        };
      }
      
      return { text: '', author: 'Anonymous' };
    });
  } else {
    normalized.reviews = [];
  }
  
  return normalized;
}

/**
 * Convert movie data to database format
 */
export function convertToDbFormat(movieData, vectorData = null) {
  const dbMovie = {
    movieId: movieData.movie_id,
    movieName: movieData.movie_name,
    releaseYear: movieData.releaseYear || movieData.release_year || null,
    duration: typeof movieData.duration === 'number' ? movieData.duration : null,
    genres: Array.isArray(movieData.genres) ? movieData.genres : [],
    synopsis: movieData.synopsis || '',
    reviews: movieData.reviews || [],
    popularity: typeof movieData.popularity === 'number' ? movieData.popularity : null,
    ageRating: movieData.ageRating || movieData.age_rating || null,
    posterUrl: movieData.posterUrl || movieData.poster_url || '',
    updatedAt: Date.now()
  };
  
  // Add vector data if provided
  if (vectorData && vectorData.vector && vectorData.dimensions) {
    dbMovie.vector = vectorData.vector;
    dbMovie.dimensions = vectorData.dimensions;
    dbMovie.vectorProcessed = true;
  }
  
  return dbMovie;
} 