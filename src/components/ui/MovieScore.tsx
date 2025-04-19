'use client';

import { motion } from 'framer-motion';

interface MovieScoreProps {
  similarity?: string | number;
  finalScore?: string | number;
  className?: string;
  large?: boolean;
}

export const calculateMatchPercentage = (score: string | number | undefined): number => {
  if (!score) return 0;
  
  const scoreValue = typeof score === 'string' ? parseFloat(score) : score;
  
  // Calculate the match percentage based on the final score
  let percentage = 0;
  
  // Handle very high scores (when user exactly matches what they're looking for)
  if (scoreValue > 0.30) {
    // Cap at 99% for extremely high matches to avoid exceeding 100%
    percentage = 99;
  }
  // Handle high scores
  else if (scoreValue > 0.10) {
    percentage = Math.min(98, Math.round(80 + (scoreValue * 100)));
  } 
  // Medium scores
  else if (scoreValue > 0.05) {
    percentage = Math.round(60 + (scoreValue * 200));
  } 
  // Low scores
  else {
    percentage = Math.round(50 + (scoreValue * 300));
  }
  
  // Ensure the percentage never exceeds 100%
  return Math.min(99, percentage);
};

const MovieScore = ({ similarity, finalScore, className = '', large = false }: MovieScoreProps) => {
  // Prefer finalScore if available, otherwise use similarity
  const score = finalScore || similarity;
  const matchPercentage = calculateMatchPercentage(score);

  if (!score) return null;
  
  return (
    <div className={`${className} ${large ? 'mt-4' : 'mt-2'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-indigo-200 ${large ? 'text-base' : 'text-sm'} font-medium`}>
          Match Score
        </span>
        <motion.span
          className={`font-bold text-white ${large ? 'text-lg' : 'text-sm'}`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {matchPercentage}%
        </motion.span>
      </div>
      <div className={`bg-slate-700 rounded-full mt-1.5 ${large ? 'h-2.5' : 'h-1.5'} shadow-inner`}>
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow"
          style={{ width: `${matchPercentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${matchPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default MovieScore; 