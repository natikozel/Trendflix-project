'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface YearRangeSliderProps {
  minYear: number;
  maxYear: number;
  onChange: (minYear: number, maxYear: number) => void;
}

const YearRangeSlider = ({ minYear, maxYear, onChange }: YearRangeSliderProps) => {
  const minPossibleYear = 1895;
  const maxPossibleYear = new Date().getFullYear();
  const range = maxPossibleYear - minPossibleYear;
  
  const trackRef = useRef<HTMLDivElement>(null);
  const leftHandleRef = useRef<HTMLDivElement>(null);
  const rightHandleRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<'left' | 'right' | null>(null);
  
  // Calculate position percentage
  const getLeftPosition = (year: number) => ((year - minPossibleYear) / range) * 100;
  const minYearPos = getLeftPosition(minYear);
  const maxYearPos = getLeftPosition(maxYear);

  // Handle + and - buttons
  const handleDecrement = () => {
    const newMin = Math.max(minPossibleYear, minYear - 5);
    const newMax = Math.max(maxYear - 5, newMin);
    onChange(newMin, newMax);
  };
  
  const handleIncrement = () => {
    const newMax = Math.min(maxPossibleYear, maxYear + 5);
    const newMin = Math.min(minYear + 5, newMax);
    onChange(newMin, newMax);
  };
  
  // Mouse/touch event handling
  useEffect(() => {
    if (!trackRef.current) return;
    
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!activeHandle || !trackRef.current) return;
      
      const track = trackRef.current;
      const trackRect = track.getBoundingClientRect();
      const trackWidth = trackRect.width;
      
      // Get clientX from either mouse or touch event
      const clientX = 'touches' in e 
        ? e.touches[0].clientX 
        : e.clientX;
      
      // Calculate position as percentage
      let percent = Math.min(Math.max(0, (clientX - trackRect.left) / trackWidth), 1) * 100;
      
      // Convert percentage to year
      const year = Math.round(minPossibleYear + (range * (percent / 100)));
      
      if (activeHandle === 'left') {
        // Don't allow minYear to go above maxYear
        const newMinYear = Math.min(year, maxYear);
        onChange(newMinYear, maxYear);
      } else {
        // Don't allow maxYear to go below minYear
        const newMaxYear = Math.max(year, minYear);
        onChange(minYear, newMaxYear);
      }
    };
    
    const handleMouseUp = () => {
      setActiveHandle(null);
    };
    
    if (activeHandle) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [activeHandle, minYear, maxYear, onChange, range]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-200">
          {minYear} - {maxYear}
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleDecrement}
            className="p-1.5 rounded-md hover:bg-gray-600/50 text-gray-300 transition-colors"
            aria-label="Decrease year range"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            className="p-1.5 rounded-md hover:bg-gray-600/50 text-gray-300 transition-colors"
            aria-label="Increase year range"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="relative h-12">
        {/* Track background */}
        <div 
          ref={trackRef}
          className="absolute h-2 w-full rounded-full bg-black border border-gray-700"
          style={{ top: '30%' }}
        >
          {/* Colored gradient track */}
          <div 
            className="absolute h-full rounded-full"
            style={{
              left: `${minYearPos}%`,
              right: `${100 - maxYearPos}%`,
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #d946ef)'
            }}
          ></div>
        </div>
        
        {/* Min Year Handle */}
        <motion.div
          ref={leftHandleRef}
          className="absolute w-5 h-5 bg-white rounded-full shadow-md cursor-pointer z-10"
          style={{ 
            left: `calc(${minYearPos}% - 10px)`, 
            top: 'calc(30% - 6px)' 
          }}
          onMouseDown={() => setActiveHandle('left')}
          onTouchStart={() => setActiveHandle('left')}
          whileTap={{ scale: 1.1 }}
          whileHover={{ scale: 1.1 }}
        />
        
        {/* Max Year Handle */}
        <motion.div
          ref={rightHandleRef}
          className="absolute w-5 h-5 bg-white rounded-full shadow-md cursor-pointer z-10"
          style={{ 
            left: `calc(${maxYearPos}% - 10px)`, 
            top: 'calc(30% - 6px)' 
          }}
          onMouseDown={() => setActiveHandle('right')}
          onTouchStart={() => setActiveHandle('right')}
          whileTap={{ scale: 1.1 }}
          whileHover={{ scale: 1.1 }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        
      </div>
    </div>
  );
};

export default YearRangeSlider; 