import { Suspense } from 'react';
import PreferenceForm from '@/components/recommend/PreferenceForm';
import MovieGrid from '@/components/movies/MovieGrid';
import { BookLoaderComponent } from '@/components/common/BookLoader';

export const metadata = {
  title: 'Get Movie Recommendations | Trendflix',
  description: 'Get personalized movie recommendations based on your preferences and interests.',
};

export default function RecommendPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section with animated gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-x"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Get Your Perfect Movie Match
          </h1>
          <p className="text-xl text-center text-gray-300 max-w-2xl mx-auto">
            Tell us what you love, and we'll find the perfect movies for you using our advanced AI recommendation system.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Left column: Preference Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50 transform hover:scale-[1.02] transition-transform duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2 text-blue-400">Your Preferences</h2>
              <p className="text-gray-400">Help us understand your taste in movies</p>
            </div>
            <PreferenceForm />
          </div>
          
          {/* Right column: Results */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2 text-purple-400">Your Recommendations</h2>
              <p className="text-gray-400">Personalized movie suggestions just for you</p>
            </div>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <BookLoaderComponent />
              </div>
            }>
              <MovieGrid />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
} 