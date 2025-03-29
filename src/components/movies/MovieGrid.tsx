'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import MovieCard from './MovieCard';
import LoadingSpinner from '../common/Loading';

const MovieGrid = () => {
  const recommendations = useSelector((state: RootState) => state.recommendations.items);
  const isLoading = useSelector((state: RootState) => state.recommendations.isLoading);
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg">No recommendations yet</p>
        <p className="text-sm mt-2">Fill out the form to get personalized movie suggestions</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((movie) => (
        <MovieCard
          key={movie.movieId}
          movie={movie}
        />
      ))}
    </div>
  );
};

export default MovieGrid; 