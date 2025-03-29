'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
  movieId: string;
  movieName: string;
  similarity: string;
  finalScore: string;
  metadata: {
    imdbRating?: number;
    releaseYear?: number;
    duration?: number;
    popularityScore?: number;
  };
}

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Link href={`/movies/${movie.movieId}`}>
      <div
        className="relative bg-gray-800 rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Movie Poster */}
        <div className="relative aspect-[2/3]">
          <Image
            src={`/posters/${movie.movieId}.jpg`}
            alt={movie.movieName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Movie Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white truncate">
            {movie.movieName}
          </h3>
          
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
            {movie.metadata.imdbRating && (
              <div className="flex items-center">
                <span className="text-yellow-400 mr-1">★</span>
                {movie.metadata.imdbRating.toFixed(1)}
              </div>
            )}
            
            {movie.metadata.releaseYear && (
              <span>{movie.metadata.releaseYear}</span>
            )}
            
            {movie.metadata.duration && (
              <span>{formatDuration(movie.metadata.duration)}</span>
            )}
          </div>

          {/* Match Score */}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Match Score</span>
              <span className="text-sm font-medium text-blue-400">
                {(parseFloat(movie.similarity) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full mt-1">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${parseFloat(movie.similarity) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              View Details
            </button>
          </div>
        )}
      </div>
    </Link>
  );
};

export default MovieCard; 