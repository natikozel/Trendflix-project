'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getSimilarMovies } from '@/lib/movies';
import MovieCard from '@/components/movie/MovieCard';
import type { Movie } from '@/lib/movies';

interface SimilarMoviesProps {
  movieId: string;
}

const SimilarMovies = ({ movieId }: SimilarMoviesProps) => {
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarMovies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/movies/${movieId}/similar`);
        if (!response.ok) {
          throw new Error('Failed to fetch similar movies');
        }
        const data = await response.json();
        setSimilarMovies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId) {
      fetchSimilarMovies();
    }
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-2xl font-semibold">Similar Movies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-gray-800/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div
          className="text-center py-12 text-red-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>Error loading similar movies: {error}</p>
        </motion.div>
      </div>
    );
  }

  if (!similarMovies.length) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div
          className="text-center py-12 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>No similar movies found.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2 
          className="text-2xl font-semibold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Similar Movies
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {similarMovies.map((movie, index) => (
            <motion.div
              key={movie.movie_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SimilarMovies; 