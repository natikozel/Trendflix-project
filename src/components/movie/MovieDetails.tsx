"use client"

import { Suspense, useEffect, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Components
import MovieHero from "./MovieHero"
import MovieDetailsTab from "./MovieDetailsTab"
// import MovieCastTab from "./MovieCastTab"
import MovieReviewsTab from "./MovieReviewsTab"
import SimilarMoviesTab from "./SimilarMoviesTab"

// Skeletons
import MovieHeroSkeleton from "@/components/movie-hero-skeleton"
import MovieDetailsTabSkeleton from "@/components/movie-details-tab-skeleton"
// import MovieCastTabSkeleton from "@/components/movie-cast-tab-skeleton"
import MovieReviewsTabSkeleton from "@/components/movie-reviews-tab-skeleton"
import SimilarMoviesTabSkeleton from "@/components/similar-movies-tab-skeleton"
import { calculateMatchPercentage } from "../ui/MovieScore"
import { useRouter } from "next/navigation";

export type movieProps = {
  movieId: string;
  movieName: string;
  popularity: number;
  posterUrl: string;
  releaseYear: number | null;
  duration: number;
  genres: string[];
  synopsis: string;
  reviews: string[]
}

export type localStorageData = {
  matchScore: number;
  similarMovies: StoredMovie[]
}

export interface StoredMovie {
  movieId: string;
  movieName: string;
  posterUrl: string;
  similarity: string;
  finalScore: string;
  popularity: number;
  metadata: {
    releaseYear?: number;
    duration?: number;
    genres?: string[];
    posterUrl: string;
    synopsis: string;
  };
}
export default function MovieDetailsPage({ movieData }: { movieData: movieProps }) {

  const [localStorageData, setLocalStorageData] = useState<localStorageData>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { movieId: id } = movieData;
        let matchScore: number = 0;
        let similarMovies: StoredMovie[] = [];
        
        const storedData = localStorage.getItem('movieRecommendations');
        if (storedData) {
          const recommendations: StoredMovie[] = JSON.parse(storedData);
          
          // Find the current movie in recommendations
          const currentMovie = recommendations.find(movie => movie.movieId === id);
          
          // Calculate match score if found
          if (currentMovie) 
            matchScore = calculateMatchPercentage(currentMovie.finalScore);
          
          // Filter out the current movie to get similar movies
          similarMovies = recommendations.filter(movie => movie.movieId !== id);
        }
              // Transform movie with match score and similar movies
        setLocalStorageData({ matchScore, similarMovies });
      } catch (error) {
        console.error('Error fetching movie data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [movieData.movieId]);

  if (loading) {
    return <div>Loading...</div>; // You could use a proper loading component here
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Back Button - Fixed position */}
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-full bg-black/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Hero Section */}
      <Suspense fallback={<MovieHeroSkeleton />}>
        <MovieHero movie={movieData} localStorageData={localStorageData!} />
      </Suspense>

      {/* Content Tabs */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex-grow">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="details">Details</TabsTrigger>
            {/* <TabsTrigger value="cast">Cast & Crew</TabsTrigger> */}
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="similar">Similar Match Percentage</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="sync">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Suspense fallback={<MovieDetailsTabSkeleton />}>
                <MovieDetailsTab movie={movieData} />
              </Suspense>
            </TabsContent>

            {/* Cast Tab
            <TabsContent value="cast">
              <Suspense fallback={<MovieCastTabSkeleton />}>
                <MovieCastTab cast={movieData.cast} />
              </Suspense>
            </TabsContent> */}

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Suspense fallback={<MovieReviewsTabSkeleton />}>
                <MovieReviewsTab reviews={movieData.reviews as any} />
              </Suspense>
            </TabsContent>

            {/* Similar Movies Tab */}
            <TabsContent value="similar">
              <Suspense fallback={<SimilarMoviesTabSkeleton />}>
                <SimilarMoviesTab similarMovies={localStorageData?.similarMovies || []} />
              </Suspense>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
