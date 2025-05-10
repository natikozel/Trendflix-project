'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setRecommendations, setUserInput } from '@/store/recommendationsSlice';
import TextInput from './TextInput';
import DurationSlider from './DurationSlider';
import GenreSelector from './GenreSelector';
import YearRangeSlider from './YearRangeSlider';
import { RootState } from '@/store/store';
import { motion, AnimatePresence } from 'framer-motion';

const PreferenceForm = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => state?.recommendations.isLoading);
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    freeText: '',
    age: 25,
    gender: 'any',
    preferredDuration: 120,
    preferredLanguage: 'English',
    preferNewReleases: false,
    yearRange: {
      minYear: 1895,
      maxYear: currentYear
    },
    genres: [] as string[],
    excludedGenres: [] as string[]
  });
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));
    
    try {
      // Send request to get recommendations, which internally validates input
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      // Check if there's a validation error returned from the LLM
      if (data.validationError) {
        setErrorMessage(data.errorMessage || 'Please provide more specific information about your movie preferences.');
        setShowErrorPopup(true);
        dispatch(setLoading(false));
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }
      
      // Save user input to Redux for feedback (only done if validation passes)
      dispatch(setUserInput(formData));
      
      // Save recommendations to Redux store
      dispatch(setRecommendations(data));
      
      // Save recommendations to local storage
      localStorage.setItem('movieRecommendations', JSON.stringify(data));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setErrorMessage('Something went wrong. Please try again later.');
      setShowErrorPopup(true);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
  };

  return (
    <>
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <label htmlFor="freeText" className="block text-sm font-medium text-gray-200">
            Tell us what kind of movies you like
          </label>
          <TextInput
            id="freeText"
            name="freeText"
            value={formData.freeText}
            onChange={handleChange}
            placeholder="E.g., I love epic fantasy movies with magic and adventure..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="age" className="block text-sm font-medium text-gray-200">
              Age
            </label>
            <div className="relative">
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="13"
                max="100"
                className="w-full px-4 py-2.5 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <div className="flex flex-col h-full">
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = Math.min(100, formData.age + 1);
                      setFormData(prev => ({ ...prev, age: newValue }));
                    }}
                    className="flex-1 flex items-center justify-center px-2 bg-gray-600/30 hover:bg-gray-600/50 rounded-tr-lg border-l border-gray-600 text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = Math.max(13, formData.age - 1);
                      setFormData(prev => ({ ...prev, age: newValue }));
                    }}
                    className="flex-1 flex items-center justify-center px-2 bg-gray-600/30 hover:bg-gray-600/50 rounded-br-lg border-l border-t border-gray-600 text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-200">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              required
            >
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Preferred Movie Duration
          </label>
          <DurationSlider
            value={formData.preferredDuration}
            onChange={(value) => setFormData(prev => ({ ...prev, preferredDuration: value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Release Year Range
          </label>
          <YearRangeSlider
            minYear={formData.yearRange.minYear}
            maxYear={formData.yearRange.maxYear}
            onChange={(minYear, maxYear) => setFormData(prev => ({ 
              ...prev, 
              yearRange: { minYear, maxYear } 
            }))}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-200">
            Preferred Language
          </label>
          <select
            id="preferredLanguage"
            name="preferredLanguage"
            value={formData.preferredLanguage}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            required
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Chinese">Chinese</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Preferred Genres
          </label>
          <GenreSelector
            selectedGenres={formData.genres}
            excludedGenres={formData.excludedGenres}
            onChange={(genres, excludedGenres) => setFormData(prev => ({ 
              ...prev, 
              genres,
              excludedGenres
            }))}
          />
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500/20"
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Getting Recommendations...</span>
            </div>
          ) : (
            'Get Recommendations'
          )}
        </motion.button>
      </motion.form>

      {/* Error Popup Modal */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeErrorPopup}
          >
            <motion.div 
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 bg-red-100 rounded-full p-1">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-white">Input Required</h3>
                  <p className="mt-2 text-gray-300">{errorMessage}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  onClick={closeErrorPopup}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PreferenceForm; 