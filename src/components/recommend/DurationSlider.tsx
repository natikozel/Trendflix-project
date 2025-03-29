'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const DurationSlider = ({ value, onChange }: DurationSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <motion.span 
          className="text-sm text-gray-400"
          animate={{ scale: isDragging ? 1.1 : 1 }}
        >
          {formatDuration(value)}
        </motion.span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(60, value - 15))}
            className="p-1 rounded-md hover:bg-gray-600/50 text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.min(240, value + 15))}
            className="p-1 rounded-md hover:bg-gray-600/50 text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min="60"
          max="240"
          step="15"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(147, 51, 234) ${(value - 60) / 1.8}%, rgb(55, 65, 81) ${(value - 60) / 1.8}%, rgb(55, 65, 81) 100%)`
          }}
        />
        <motion.div
          className="absolute -top-6 left-0 text-xs text-gray-400 whitespace-nowrap"
          style={{ left: `${(value - 60) / 1.8}%` }}
          animate={{
            scale: isDragging ? 1.1 : 1,
            y: isDragging ? -2 : 0
          }}
        >
          {formatDuration(value)}
        </motion.div>
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>1h</span>
        <span>4h</span>
      </div>
    </motion.div>
  );
};

export default DurationSlider; 