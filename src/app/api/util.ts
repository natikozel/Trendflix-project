import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

interface MovieReview {
  text: string;
}

interface Movie {
  movie_id: string;
  movie_name: string;
  imdbRating?: number;
  releaseYear?: number;
  duration?: number;
  popularityScore?: number;
  reviews: MovieReview[];
}

export async function loadMovieData(): Promise<Movie[]> {
  try {
    const dataDir = join(process.cwd(), 'src/data');
    // List files in directory
    const files = await readdir(dataDir);
    
    const movieData: Movie[] = [];

    // Process each JSON file
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = join(dataDir, file);
          const rawData = await readFile(filePath, 'utf8');
          const data = JSON.parse(rawData);
          
          // Validate and clean the data
          const movie: Movie = {
            movie_id: data.movie_id || file.replace('.json', ''),
            movie_name: data.movie_name || data.movie_id || 'Unknown Movie',
            imdbRating: data.imdbRating,
            releaseYear: data.releaseYear,
            duration: data.duration,
            popularityScore: data.popularityScore,
            reviews: Array.isArray(data.reviews) ? data.reviews : []
          };

          // Ensure reviews have the correct structure
          movie.reviews = movie.reviews.map(review => ({
            text: typeof review === 'string' ? review : review.text || ''
          }));

          // Add sample reviews if none exist
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

// Helper function to validate movie data
export function validateMovieData(movie: Movie): boolean {
  return (
    typeof movie.movie_id === 'string' &&
    typeof movie.movie_name === 'string' &&
    Array.isArray(movie.reviews) &&
    movie.reviews.every(review => typeof review.text === 'string')
  );
}

// Helper function to clean movie data
export function cleanMovieData(movie: Movie): Movie {
  return {
    movie_id: movie.movie_id || 'unknown',
    movie_name: movie.movie_name || 'Unknown Movie',
    imdbRating: typeof movie.imdbRating === 'number' ? movie.imdbRating : undefined,
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