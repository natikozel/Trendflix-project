'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeedbackButtonsProps {
  movieId: string;
  onFeedbackSubmit: (movieId: string, liked: boolean) => Promise<unknown>;
}

const FeedbackButtons = ({ movieId, onFeedbackSubmit }: FeedbackButtonsProps) => {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (liked: boolean) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const newFeedback = liked ? 'like' : 'dislike';
    
    try {
      await onFeedbackSubmit(movieId, liked);
      setFeedback(newFeedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <p className="text-sm text-gray-300 mr-1 mr-3">Was this accurate?</p>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleFeedback(true)}
        disabled={isSubmitting || feedback !== null}
        className={cn(
          "flex items-center justify-center p-2 rounded-full transition-colors",
          feedback === 'like' 
            ? "bg-green-500/20 text-green-400" 
            : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300",
          (isSubmitting || feedback !== null) && feedback !== 'like' && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Like this recommendation"
      >
        <ThumbsUp size={16} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleFeedback(false)}
        disabled={isSubmitting || feedback !== null}
        className={cn(
          "flex items-center justify-center p-2 rounded-full transition-colors",
          feedback === 'dislike' 
            ? "bg-red-500/20 text-red-400" 
            : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300",
          (isSubmitting || feedback !== null) && feedback !== 'dislike' && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Dislike this recommendation"
      >
        <ThumbsDown size={16} />
      </motion.button>
      
      {feedback && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-gray-400"
        >
          {feedback === 'like' ? 'Thanks for your feedback!' : 'We will improve our recommendations.'}
        </motion.span>
      )}
    </div>
  );
};

export default FeedbackButtons; 