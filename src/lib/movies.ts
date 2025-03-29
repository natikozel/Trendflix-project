import { readFile } from 'fs/promises';
import { join } from 'path';
import { loadMovieData } from '@/app/api/util';
import Recommender from '@/algorithm/recommender';

let movieCache: Movie[] = [];

export interface MovieReview {
  text?: string;
  author?: string;
  rating?: number;
  content?: string;
}

export interface Movie {
  movie_id: string;
  movie_name: string;
  posterUrl?: string;
  imdbRating?: number;
  releaseYear?: number;
  duration?: number;
  genres?: string[];
  synopsis?: string;
  reviews?: MovieReview[];
  popularity?: number;
}

interface RecommenderResult {
  movieId: string;
  movieName: string;
  similarity: string;
  finalScore: number;
  metadata?: {
    imdbRating: number;
    releaseYear: number;
    duration: number;
    popularityScore: number;
  };
}

function isMovie(obj: any): obj is Movie {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.movie_id === 'string' &&
    typeof obj.movie_name === 'string' &&
    (obj.posterUrl === undefined || typeof obj.posterUrl === 'string') &&
    (obj.imdbRating === undefined || typeof obj.imdbRating === 'number') &&
    (obj.releaseYear === undefined || typeof obj.releaseYear === 'number') &&
    (obj.duration === undefined || typeof obj.duration === 'number') &&
    (obj.genres === undefined || (Array.isArray(obj.genres) && obj.genres.every((g: any) => typeof g === 'string'))) &&
    (obj.synopsis === undefined || typeof obj.synopsis === 'string') &&
    (obj.reviews === undefined || (Array.isArray(obj.reviews) && obj.reviews.every((r: any) => isMovieReview(r)))) &&
    (obj.popularity === undefined || typeof obj.popularity === 'number')
  );
}

function isMovieReview(obj: any): obj is MovieReview {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj.author === undefined || typeof obj.author === 'string') &&
    (obj.rating === undefined || typeof obj.rating === 'number') &&
    (obj.content === undefined || typeof obj.content === 'string')
  );
}

export async function getMovies(): Promise<Movie[]> {
  try {
    if (movieCache.length > 0) {
      return movieCache;
    }

    const loadedMovies = await loadMovieData();
    if (Array.isArray(loadedMovies) && loadedMovies.every(isMovie)) {
      movieCache = loadedMovies;
      return loadedMovies;
    }
    throw new Error('Invalid movie data format');
  } catch (error) {
    console.error('Error loading movies:', error);
    return [];
  }
}

export async function getMovieById(id: string): Promise<Movie | null> {
  try {
    const movies = await getMovies();
    return movies.find(movie => movie.movie_id === id) || null;
  } catch (error) {
    console.error('Error getting movie by ID:', error);
    return null;
  }
}

export async function getSimilarMovies(movieId: string, limit: number = 6): Promise<Movie[]> {
  try {
    const dummyMovies: Movie[] = [
      {
        movie_id: "tt0816692",
        movie_name: "Interstellar",
        posterUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        imdbRating: 8.6,
        releaseYear: 2014,
        duration: 169,
        genres: ["Adventure", "Drama", "Sci-Fi"],
        synopsis: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        reviews: [
          {
            author: "MovieCritic123",
            rating: 9.0,
            content: "A masterpiece of modern science fiction. Christopher Nolan outdoes himself with this epic space adventure."
          },
          {
            author: "SpaceEnthusiast",
            rating: 8.5,
            content: "Incredible visuals and a mind-bending story. The black hole scenes are unforgettable."
          }
        ],
        popularity: 0.95
      },
      {
        movie_id: "tt1375666",
        movie_name: "Inception",
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
        imdbRating: 8.8,
        releaseYear: 2010,
        duration: 148,
        genres: ["Action", "Adventure", "Sci-Fi"],
        synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        reviews: [
          {
            author: "DreamExplorer",
            rating: 9.5,
            content: "A mind-bending masterpiece that challenges your perception of reality."
          },
          {
            author: "FilmBuff42",
            rating: 8.8,
            content: "Complex, visually stunning, and intellectually stimulating. Nolan at his best."
          }
        ],
        popularity: 0.92
      }
    ];

    return dummyMovies
      .filter(movie => movie.movie_id !== movieId)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting similar movies:', error);
    return [];
  }
} 