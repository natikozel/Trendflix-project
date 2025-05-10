'use client';

import { motion } from 'framer-motion';

interface GenreSelectorProps {
  selectedGenres: string[];
  excludedGenres: string[];
  onChange: (selectedGenres: string[], excludedGenres: string[]) => void;
}

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

const GenreSelector = ({ selectedGenres, excludedGenres, onChange }: GenreSelectorProps) => {
  const toggleGenre = (genre: string) => {
    let newSelected = [...selectedGenres];
    let newExcluded = [...excludedGenres];

    if (selectedGenres.includes(genre)) {
      newSelected = newSelected.filter(g => g !== genre);
      newExcluded.push(genre);
    } else if (excludedGenres.includes(genre)) {
      newExcluded = newExcluded.filter(g => g !== genre);
    } else {
      newSelected.push(genre);
    }

    onChange(newSelected, newExcluded);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          const isExcluded = excludedGenres.includes(genre);
          return (
            <motion.button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20'
                  : isExcluded
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
            >
              <motion.span
                initial={false}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-1"
              >
                {isSelected && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                )}
                {isExcluded && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </motion.svg>
                )}
                <span>{genre}</span>
              </motion.span>
            </motion.button>
          );
        })}
      </div>
      <motion.div 
        className="text-sm text-gray-400 flex items-center space-x-4"
        animate={{ opacity: [0, 1], y: [10, 0] }}
        transition={{ duration: 0.3 }}
      >
        <div className={`flex items-center space-x-2 ${selectedGenres.length > 0 ? 'block' : 'hidden'}`}>
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-400">{selectedGenres.length} genres included</span>
        </div>
        <div className={`flex items-center space-x-2 ${excludedGenres.length > 0 ? 'block' : 'hidden'}`}>
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-red-400">{excludedGenres.length} genres excluded</span>
      </div>
        
      </motion.div>
    </div>
  );
};

export default GenreSelector; 