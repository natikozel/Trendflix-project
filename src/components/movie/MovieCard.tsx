'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface MovieCardProps {
  movie: {
    movie_id: string;
    movie_name: string;
    posterUrl?: string;
    imdbRating?: number;
    releaseYear?: number;
    genres?: string[];
  };
}

const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <Link href={`/movie/${movie.movie_id}`}>
      <motion.div
        className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="aspect-[2/3] relative">
          <Image
            src={movie.posterUrl || '/placeholder-poster.svg'}
            alt={movie.movie_name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-4 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold line-clamp-2 mb-2">{movie.movie_name}</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {movie.imdbRating && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">{movie.imdbRating.toFixed(1)}</span>
                </div>
              )}
              {movie.releaseYear && (
                <span className="text-sm text-gray-300">{movie.releaseYear}</span>
              )}
            </div>
          </div>
          
          {movie.genres && movie.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-1 text-xs bg-gray-700/50 rounded-full"
                >
                  {genre}
                </span>
              ))}
              {movie.genres.length > 2 && (
                <span className="px-2 py-1 text-xs bg-gray-700/50 rounded-full">
                  +{movie.genres.length - 2}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;