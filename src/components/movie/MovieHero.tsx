'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import type { Movie } from '@/lib/movies';

interface MovieHeroProps {
  movie: {
    movieName: string;
    posterUrl: string;
    releaseYear?: number;
    duration?: number;
    genres?: string[];
    imdbRating?: number;
  };
}

export default function MovieHero({ movie }: MovieHeroProps) {
  // Default image if posterUrl is missing
  const posterSrc = movie.posterUrl || '/images/movie-placeholder.jpg';

  return (
    <div className="relative w-full bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="absolute inset-0 z-0 opacity-30">
        {/* Blurred background image */}
        <div 
          className="w-full h-full bg-center bg-cover blur-sm" 
          style={{ backgroundImage: `url(${posterSrc})` }}
        />
      </div>
      
      <div className="container relative z-10 mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Movie poster */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0 w-64 h-96 rounded-lg overflow-hidden shadow-2xl"
          >
            <Image
              src={posterSrc}
              alt={movie.movieName}
              width={256}
              height={384}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if the image fails to load
                e.currentTarget.src = '/images/movie-placeholder.jpg';
              }}
            />
          </motion.div>
          
          {/* Movie info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{movie.movieName}</h1>
            
            <div className="flex flex-wrap gap-2 items-center mb-4">
              {movie.releaseYear && <span className="text-gray-300">{movie.releaseYear}</span>}
              {movie.duration && <span className="text-gray-300">{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>}
              {movie.imdbRating && (
                <span className="bg-yellow-500 text-black px-2 py-1 rounded font-bold text-sm">
                  IMDb {movie.imdbRating.toFixed(1)}
                </span>
              )}
            </div>
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map(genre => (
                  <span 
                    key={genre} 
                    className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 