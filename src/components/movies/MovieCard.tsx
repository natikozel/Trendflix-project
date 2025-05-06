'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import defaultPoster from '@/assets/default_poster.jpg';
export interface Movie {
  movieId: string;
  movieName: string;
  similarity: string;
  finalScore: string;
  metadata: {
    popularity?: number;
    releaseYear?: number;
    duration?: number;
    genres?: string[],
    posterUrl: string
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

  const calculateMatchPercentage = (score: string): number => {
    const scoreValue = parseFloat(score);
    console.log(scoreValue);
    // Convert to a more representative percentage that preserves relative differences
    // For scores typically in the 0.01-0.20 range, this will create a wider visual spread
    
    // First, determine if this is a high or low score based on typical cosine similarity ranges
    if (scoreValue > 0.6) 
      return Math.round(35 + (scoreValue * 100 - 10));
     else if (scoreValue > 0.3)       
      return Math.round(25 + (scoreValue * 100));
     else 
      return Math.round(15 + (scoreValue * 100));
    
  };



  return (
    <Link href={`/movie/${movie.movieId}`}>
      <div
        className="relative bg-gray-800 rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Movie Poster */}
        <div className="relative aspect-[2/3]">
          <Image
            src={movie.metadata.posterUrl ? movie.metadata.posterUrl : defaultPoster}
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
            {movie.metadata.popularity && (
              <div className="flex items-center">
                <span className="text-yellow-400 mr-1">★</span>
                {movie.metadata.popularity.toFixed(1)}
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
                {calculateMatchPercentage(movie.finalScore)}%
              </span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full mt-1">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{ 
                  width: `${calculateMatchPercentage(movie.finalScore)}%` 
                }}
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