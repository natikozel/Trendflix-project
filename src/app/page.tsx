import { Suspense } from 'react';
import PreferenceForm from '@/components/recommend/PreferenceForm';
import MovieGrid from '@/components/movies/MovieGrid';
import Loading from '@/components/common/Loading';

export const metadata = {
  title: 'Get Movie Recommendations | Trendflix',
  description: 'Get personalized movie recommendations based on your preferences and interests.',
};

export default function RecommendPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Get Your Perfect Movie Match
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <PreferenceForm />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Your Recommendations</h2>
            <Suspense fallback={<Loading />}>
              <MovieGrid />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
} 