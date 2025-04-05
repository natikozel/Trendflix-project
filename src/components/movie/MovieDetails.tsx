'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { Share, Heart } from 'lucide-react';
import type { Movie } from '@/lib/movies';

interface MovieDetailsProps {
  movie: Movie;
}

const MovieDetails = ({ movie }: MovieDetailsProps) => {
  const [activeTab, setActiveTab] = useState<'synopsis' | 'reviews'>('synopsis');
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const handleWatchlistClick = () => {
    setIsInWatchlist(!isInWatchlist);
    // In a real app, this would call an API to update the user's watchlist
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.movie_name || 'Movie',
          text: movie.synopsis || 'Check out this movie!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You would show a toast notification here
    }
  };

  if (!movie) return null;

  return (
    <motion.div 
      className="container mx-auto px-4 py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('synopsis')}
          className={`pb-4 px-4 text-lg font-medium transition-colors relative
            ${activeTab === 'synopsis' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Synopsis
          {activeTab === 'synopsis' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
              layoutId="activeTab"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 px-4 text-lg font-medium transition-colors relative
            ${activeTab === 'reviews' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Reviews
          {activeTab === 'reviews' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
              layoutId="activeTab"
            />
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'synopsis' && (
          <motion.div
            key="synopsis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">About the Movie</h2>
              <p className="text-gray-300 leading-relaxed">
                {movie.synopsis || 'No synopsis available.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-sm font-medium text-gray-400 mb-2">Release Year</h3>
                <p className="text-xl font-semibold">{movie.releaseYear || 'N/A'}</p>
              </motion.div>

              <motion.div
                className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm font-medium text-gray-400 mb-2">Duration</h3>
                <p className="text-xl font-semibold">
                  {movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : 'N/A'}
                </p>
              </motion.div>

              <motion.div
                className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-sm font-medium text-gray-400 mb-2">Rating</h3>
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xl font-semibold">{movie.imdbRating?.toFixed(1) || 'N/A'}</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-sm font-medium text-gray-400 mb-2">Popularity</h3>
                <p className="text-xl font-semibold">{movie.popularity?.toFixed(1) || 'N/A'}</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {movie.reviews && movie.reviews.length > 0 ? (
              movie.reviews.map((review, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {review.author?.[0]?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{review.author || 'Anonymous'}</h3>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-400">{review.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300">{review.content || 'No content available.'}</p>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="text-center py-12 text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No reviews available for this movie.
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 space-y-4">
        <Button
          variant={isInWatchlist ? 'secondary' : 'primary'}
          className="w-full"
          onClick={handleWatchlistClick}
          leftIcon={<Heart className={isInWatchlist ? 'fill-current' : ''} />}
        >
          {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleShare}
          leftIcon={<Share />}
        >
          Share
        </Button>
      </div>
    </motion.div>
  );
};

export default MovieDetails; 