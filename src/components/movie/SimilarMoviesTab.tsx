"use client"

import { motion } from "framer-motion"
import { StoredMovie } from "./MovieDetails"


type SimilarMoviesTabProps = {
  similarMovies: StoredMovie[]
}

export default function SimilarMoviesTab({ similarMovies }: SimilarMoviesTabProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h2 className="text-2xl font-bold mb-6" variants={itemVariants}>
        Movies with Similar Match Percentage
      </motion.h2>
      <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {similarMovies.map((movie, index) => (
          <motion.div
            key={movie.movieId}
            className="group cursor-pointer"
            variants={itemVariants}
            custom={index}
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-gray-800">
              <motion.img
                src={movie.metadata.posterUrl || "/placeholder.svg"}
                alt={movie.movieName}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              />
            </div>
            <h3 className="font-semibold group-hover:text-purple-400 transition-colors">{movie.movieName}</h3>
            <p className="text-sm text-gray-400">{movie.metadata.releaseYear}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
