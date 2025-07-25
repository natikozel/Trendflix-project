import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

interface MovieReview {
  text: string;
}

interface Movie {
  movie_id: string;
  movie_name: string;
  rating?: number;
  releaseYear?: number;
  duration?: number;
  popularityScore?: number;
  reviews: MovieReview[];
}

export async function loadMovieData(): Promise<Movie[]> {
  try {
    const dataDir = join(process.cwd(), 'src/data');
    const files = await readdir(dataDir);
    
    const movieData: Movie[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = join(dataDir, file);
          const rawData = await readFile(filePath, 'utf8');
          const data = JSON.parse(rawData);
          
          const movie: Movie = {
            movie_id: data.movie_id || file.replace('.json', ''),
            movie_name: data.movie_name || data.movie_id || 'Unknown Movie',
            rating: data.rating,
            releaseYear: data.releaseYear,
            duration: data.duration,
            popularityScore: data.popularityScore,
            reviews: Array.isArray(data.reviews) ? data.reviews : []
          };

          movie.reviews = movie.reviews.map(review => ({
            text: typeof review === 'string' ? review : review.text || ''
          }));

          if (movie.reviews.length === 0) {
            movie.reviews = [
              { text: `Sample review for ${movie.movie_name}` },
              { text: `Another review for ${movie.movie_name}` }
            ];
          }

          movieData.push(movie);
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }
    }

    return movieData;
  } catch (error) {
    console.error('Error loading movie data:', error);
    throw error;
  }
}

export function validateMovieData(movie: Movie): boolean {
  return (
    typeof movie.movie_id === 'string' &&
    typeof movie.movie_name === 'string' &&
    Array.isArray(movie.reviews) &&
    movie.reviews.every(review => typeof review.text === 'string')
  );
}

export function cleanMovieData(movie: Movie): Movie {
  return {
    movie_id: movie.movie_id || 'unknown',
    movie_name: movie.movie_name || 'Unknown Movie',
    rating: typeof movie.rating === 'number' ? movie.rating : undefined,
    releaseYear: typeof movie.releaseYear === 'number' ? movie.releaseYear : undefined,
    duration: typeof movie.duration === 'number' ? movie.duration : undefined,
    popularityScore: typeof movie.popularityScore === 'number' ? movie.popularityScore : undefined,
    reviews: Array.isArray(movie.reviews)
      ? movie.reviews.map(review => ({
          text: typeof review === 'string' ? review : review.text || ''
        }))
      : []
  };
} 