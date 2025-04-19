"use client"

import { Suspense } from "react"
import { AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Components
import MovieHero from "./components/movie-hero"
import MovieDetailsTab from "./components/movie-details-tab"
import MovieCastTab from "./components/movie-cast-tab"
import MovieReviewsTab from "./components/movie-reviews-tab"
import SimilarMoviesTab from "./components/similar-movies-tab"

// Skeletons
import MovieHeroSkeleton from "./components/skeletons/movie-hero-skeleton"
import MovieDetailsTabSkeleton from "./components/skeletons/movie-details-tab-skeleton"
import MovieCastTabSkeleton from "./components/skeletons/movie-cast-tab-skeleton"
import MovieReviewsTabSkeleton from "./components/skeletons/movie-reviews-tab-skeleton"
import SimilarMoviesTabSkeleton from "./components/skeletons/similar-movies-tab-skeleton"

// Mock data - in a real app, this would come from an API
import { movieData } from "./data/movie-data"

export default function MovieDetailsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Back Button - Fixed position */}
      <div className="fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" className="rounded-full bg-black/50 hover:bg-black/70">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Hero Section */}
      <Suspense fallback={<MovieHeroSkeleton />}>
        <MovieHero movie={movieData} />
      </Suspense>

      {/* Content Tabs */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex-grow">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="cast">Cast & Crew</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="similar">Similar Movies</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Suspense fallback={<MovieDetailsTabSkeleton />}>
                <MovieDetailsTab movie={movieData} />
              </Suspense>
            </TabsContent>

            {/* Cast Tab */}
            <TabsContent value="cast">
              <Suspense fallback={<MovieCastTabSkeleton />}>
                <MovieCastTab cast={movieData.cast} />
              </Suspense>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Suspense fallback={<MovieReviewsTabSkeleton />}>
                <MovieReviewsTab reviews={movieData.reviews} />
              </Suspense>
            </TabsContent>

            {/* Similar Movies Tab */}
            <TabsContent value="similar">
              <Suspense fallback={<SimilarMoviesTabSkeleton />}>
                <SimilarMoviesTab similarMovies={movieData.similarMovies} />
              </Suspense>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
