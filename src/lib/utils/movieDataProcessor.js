export function normalizeMovieData(movieData, filename = '') {
  if (!movieData) {
    throw new Error('Invalid movie data: undefined or null');
  }
  
  const normalized = { ...movieData };
  
  if (!normalized.movie_id) {
    if (filename) {
      const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      normalized.movie_id = filenameWithoutExt;
    } else {
      normalized.movie_id = `movie_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  }
  
  if (!normalized.movie_name) {
    normalized.movie_name = normalized.movie_id;
  }
  
  normalized.releaseYear = normalized.release_year || normalized.releaseYear;
  normalized.posterUrl = normalized.poster_url || normalized.posterUrl;
  normalized.ageRating = normalized.age_rating || normalized.ageRating || null;
  
  normalized.genres = Array.isArray(normalized.genres) ? normalized.genres : [];
  
  if (Array.isArray(normalized.reviews)) {
    normalized.reviews = normalized.reviews.map(review => {
      if (typeof review === 'string') {
        return { text: review, author: 'Anonymous' };
      }
      
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
  
  if (vectorData && vectorData.vector && vectorData.dimensions) {
    dbMovie.vector = vectorData.vector;
    dbMovie.dimensions = vectorData.dimensions;
    dbMovie.vectorProcessed = true;
  }
  
  return dbMovie;
}