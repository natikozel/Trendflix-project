"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Calendar, Star, Share2, Play, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check } from "@/components/check"
import { localStorageData, movieProps } from "./MovieDetails"

// TMDB API configuration
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTA2YzUxZDIzZTlkYjQ4OGI0MDc4YjA0ODIwMzdhZiIsIm5iZiI6MTc0MzI1OTUzOC44ODIsInN1YiI6IjY3ZTgwNzkyNmIzNjdkNDY5NTY3YmZhNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xs8URWnkdu6teP6FooMttGgpyfF5qgym8wj1kjLBiKU" // Replace with your actual API key
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

type MovieHeroProps = {
  movie: movieProps // In a real app, you'd use a proper type here
  localStorageData: localStorageData
}

export default function MovieHero({ movie, localStorageData }: MovieHeroProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [trailerError, setTrailerError] = useState<string | null>(null)

  const toggleWatchlist = () => {
    setIsInWatchlist(!isInWatchlist)
  }

  const fetchTrailer = async (movieName: string, releaseYear: string) => {
    setTrailerError(null)
    
    try {
      // First, search for the movie to get its TMDB ID using name and year
      const query = `${movieName} ${releaseYear}`;
      const searchResponse = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(movieName)}&primary_release_year=${releaseYear}`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!searchResponse.ok) {
        throw new Error(`Failed to search for movie: ${searchResponse.status}`)
      }
      
      const searchData = await searchResponse.json()
      
      if (!searchData.results || searchData.results.length === 0) {
        throw new Error(`No results found for movie: ${query}`)
      }
      
      // Get the first result's ID
      const movieId = searchData.results[0].id
      
      // Then fetch the videos for this movie
      const videosResponse = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/videos`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!videosResponse.ok) {
        throw new Error(`Failed to fetch videos: ${videosResponse.status}`)
      }
      
      const videosData = await videosResponse.json()
      
      // Find a trailer using the type attribute
      const trailer = videosData.results?.find(
        (video: any) => video.type === "Trailer" && video.site === "YouTube"
      )
      
      if (!trailer) {
        throw new Error("No trailer found for this movie")
      }
      
      // Use the key attribute for the YouTube video ID
      return `https://www.youtube.com/embed/${trailer.key}?autoplay=1`
    } catch (error) {
      console.error("Error fetching trailer:", error)
      throw error
    }
  }

  const openTrailer = async () => {
    setIsLoading(true)
    setTrailerOpen(true)
    
    try {
      const url = await fetchTrailer(movie?.movieName, movie?.releaseYear as unknown as string)
      setTrailerUrl(url)
    } catch (error: any) {
      console.error("Failed to fetch trailer:", error)
      setTrailerError(error.message || "Failed to load trailer")
      setTrailerUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  const closeTrailer = () => {
    setTrailerOpen(false)
    setTrailerUrl(null)
    setTrailerError(null)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { 
        duration: 0.2 
      }
    }
  }

  return (
    <>
      <div
        className="relative w-full bg-cover bg-center"
        style={{
          height: "min(70vh, 700px)",
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.9)), url(${movie.posterUrl})`,
          backgroundPosition: "center 20%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

        {/* Content Container */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 w-full p-4 sm:p-6 z-10 mx-auto max-w-7xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Poster */}
            <motion.div
              className="hidden md:block w-36 lg:w-48 h-auto aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-gray-800 flex-shrink-0"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <img src={movie.posterUrl || "/placeholder.svg"} alt={movie.movieName} className="w-full h-full object-cover" />
            </motion.div>

            {/* Movie Info */}
            <div className="flex-1">
              <motion.div className="flex flex-wrap items-center gap-2 mb-2" variants={itemVariants}>
                {movie.genres.map((genre: string, index: number) => (
                  <motion.div key={genre} variants={itemVariants} custom={index}>
                    <Badge variant="outline" className="bg-purple-900/50 text-purple-100 border-purple-700">
                      {genre}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>

              <motion.h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2" variants={itemVariants}>
                {movie.movieName}
              </motion.h1>

              <motion.div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4" variants={itemVariants}>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.releaseYear}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{movie.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span>{movie.popularity}</span>
                </div>
              </motion.div>

              {/* Match Score */}
              <motion.div className="mb-4" variants={itemVariants}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400">Match Score</span>
                  <span className="font-bold text-green-400">{localStorageData.matchScore}%</span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                >
                  <Progress value={localStorageData.matchScore} className="h-1.5 w-48 bg-gray-600" />
                </motion.div>
              </motion.div>

              <motion.p className="text-gray-300 mb-6 max-w-2xl line-clamp-3 sm:line-clamp-none" variants={itemVariants}>
                {movie.synopsis}
              </motion.p>

              {/* Action Buttons */}
              <motion.div className="flex flex-wrap gap-3" variants={itemVariants}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={openTrailer}>
                    <Play className="mr-2 h-4 w-4" /> Watch Trailer
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={isInWatchlist ? "default" : "outline"}
                    onClick={toggleWatchlist}
                    className={isInWatchlist ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {isInWatchlist ? (
                      <>
                        <Check className="text-black mr-2 h-4 w-4" /> <span className="">In Watchlist</span>
                      </>
                    ) : (
                      <>
                        <Plus className="text-black mr-2 h-4 w-4" /> <span className="text-black">Add to Watchlist</span>
                      </>
                    )}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline">
                    <Share2 className="text-black mr-2 h-4 w-4" /> <span className="text-black">Share</span>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {trailerOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <motion.div 
              className="relative w-full h-full max-w-6xl max-h-[80vh] mx-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={closeTrailer}
                  variant="outline"
                  className="rounded-full bg-black/50 hover:bg-black/70 p-2 h-10 w-10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="w-full h-full flex items-center justify-center p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-300">Loading trailer...</p>
                  </div>
                ) : trailerUrl ? (
                  <div className="aspect-video w-full h-full max-h-[80vh]">
                    <iframe
                      src={trailerUrl}
                      title={`${movie.movieName} Trailer`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : trailerError ? (
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{trailerError}</p>
                    <Button className="text-black" onClick={closeTrailer} variant="outline">Close</Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-red-500 mb-2">Failed to load trailer</p>
                    <Button className="text-black" onClick={closeTrailer} variant="outline">Close</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
