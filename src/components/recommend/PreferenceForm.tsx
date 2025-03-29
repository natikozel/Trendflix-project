'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setRecommendations } from '@/store/recommendationsSlice';
import TextInput from './TextInput';
import DurationSlider from './DurationSlider';
import GenreSelector from './GenreSelector';

const PreferenceForm = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    freeText: '',
    age: 25,
    gender: 'any',
    preferredDuration: 120,
    preferredLanguage: 'English',
    preferNewReleases: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="freeText" className="block text-sm font-medium mb-2">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-2">
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
            className="w-full px-3 py-2 bg-gray-700 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-2">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 rounded-md"
            required
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Preferred Movie Duration
        </label>
        <DurationSlider
          value={formData.preferredDuration}
          onChange={(value) => setFormData(prev => ({ ...prev, preferredDuration: value }))}
        />
      </div>

      <div>
        <label htmlFor="preferredLanguage" className="block text-sm font-medium mb-2">
          Preferred Language
        </label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          value={formData.preferredLanguage}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 rounded-md"
          required
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Japanese">Japanese</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Preferred Genres
        </label>
        <GenreSelector
          selectedGenres={formData.genres || []}
          onChange={(genres) => setFormData(prev => ({ ...prev, genres }))}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="preferNewReleases"
          name="preferNewReleases"
          checked={formData.preferNewReleases}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <label htmlFor="preferNewReleases" className="ml-2 text-sm">
          Prefer newer releases
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
      </button>
    </form>
  );
};

export default PreferenceForm; 