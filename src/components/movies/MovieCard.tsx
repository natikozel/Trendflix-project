'use client';

import Image from 'next/image';
import Link from 'next/link';
import defaultPoster from '@/assets/default_poster.jpg';
import FeedbackButtons from '../common/FeedbackButtons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { saveFeedback } from '@/app/actions/feedback';

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
  // Get the current user input from Redux store
  const userInputData = useSelector((state: RootState) => state.recommendations.userInput);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateMatchPercentage = (score: string): number => {
    const scoreValue = parseFloat(score);
    
    // Convert to a more representative percentage that preserves relative differences
    // For scores typically in the 0.01-0.20 range, this will create a wider visual spread
    
    // First, determine if this is a high or low score based on typical cosine similarity ranges
    if (scoreValue > 0.10) {
      // High score (like Titanic at 0.1514)
      return Math.round(85 + (scoreValue * 100 - 10));
    } else if (scoreValue > 0.05) {
      // Medium score (like Schindler's List at 0.0699)
      return Math.round(60 + (scoreValue * 200));
    } else {
      // Low score
      return Math.round(50 + (scoreValue * 300));
    }
  };

  const handleFeedbackSubmit = async (movieId: string, liked: boolean) => {
    try {
      if (!userInputData) {
        throw new Error('No user input data available');
      }
      
      // Call the server action directly instead of using fetch/API
      const result = await saveFeedback(
        movieId,
        liked,
        userInputData,
        movie.finalScore
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      return result;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  return (
    <div
      className="relative bg-gray-800 rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105"
    >
      {/* Movie Poster with Link */}
      <Link href={`/movie/${movie.movieId}`}>
        <div className="relative aspect-[2/3]">
          <Image
            src={movie.metadata.posterUrl ? movie.metadata.posterUrl : defaultPoster}
            alt={movie.movieName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      {/* Movie Info */}
      <div className="p-4">
        <Link href={`/movie/${movie.movieId}`}>
          <h3 className="text-lg font-semibold text-white truncate">
            {movie.movieName}
          </h3>
        </Link>
        
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

        {/* Feedback Buttons */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <FeedbackButtons 
            movieId={movie.movieId} 
            onFeedbackSubmit={handleFeedbackSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default MovieCard; 