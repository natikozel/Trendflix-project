'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import type { Movie } from '@/lib/movies';

interface MovieHeroProps {
  movie: Movie;
}

const MovieHero = ({ movie }: MovieHeroProps) => {
  if (!movie) return null;

  return (
    <motion.div 
      className="relative min-h-[70vh] w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={movie.posterUrl || '/placeholder-poster.svg'}
          alt={movie.movie_name}
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Poster */}
        <motion.div 
          className="w-64 md:w-80 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Image
            src={movie.posterUrl || '/placeholder-poster.svg'}
            alt={movie.movie_name}
            width={320}
            height={480}
            className="w-full h-auto"
            priority
          />
        </motion.div>

        {/* Info */}
        <motion.div 
          className="flex-1 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {movie.movie_name}
          </motion.h1>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            {movie.releaseYear && (
              <motion.span 
                className="text-gray-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                {movie.releaseYear}
              </motion.span>
            )}
            {movie.duration && (
              <motion.span 
                className="text-gray-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
              >
                {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
              </motion.span>
            )}
            {movie.imdbRating && (
              <motion.div 
                className="flex items-center gap-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1 }}
              >
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold">{movie.imdbRating.toFixed(1)}</span>
              </motion.div>
            )}
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <motion.div 
              className="flex flex-wrap gap-2 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm"
                >
                  {genre}
                </span>
              ))}
            </motion.div>
          )}

          {movie.synopsis && (
            <motion.p 
              className="text-gray-300 text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              {movie.synopsis}
            </motion.p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MovieHero; 