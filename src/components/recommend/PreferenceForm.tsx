'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setRecommendations } from '@/store/recommendationsSlice';
import TextInput from './TextInput';
import DurationSlider from './DurationSlider';
import GenreSelector from './GenreSelector';
import { RootState } from '@/store/store';
import { motion } from 'framer-motion';

const PreferenceForm = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => state?.recommendations.isLoading);
  const [formData, setFormData] = useState({
    freeText: '',
    age: 25,
    gender: 'any',
    preferredDuration: 120,
    preferredLanguage: 'English',
    preferNewReleases: false,
    genres: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      dispatch(setRecommendations(data));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // TODO: Add error handling UI
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

  return (
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
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="13"
            max="100"
            className="w-full px-4 py-2.5 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            required
          />
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
          onChange={(genres) => setFormData(prev => ({ ...prev, genres }))}
        />
      </div>

      <div className="flex items-center space-x-3 bg-gray-700/30 p-4 rounded-lg">
        <input
          type="checkbox"
          id="preferNewReleases"
          name="preferNewReleases"
          checked={formData.preferNewReleases}
          onChange={handleChange}
          className="h-5 w-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500/20 transition-all duration-200"
        />
        <label htmlFor="preferNewReleases" className="text-sm text-gray-200">
          Prefer newer releases
        </label>
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
  );
};

export default PreferenceForm; 