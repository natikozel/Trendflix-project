"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/Badge"

type MovieDetailsTabProps = {
  movie: any // In a real app, you'd use a proper type here
}

export default function MovieDetailsTab({ movie }: MovieDetailsTabProps) {
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

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="col-span-1 md:col-span-2" variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
        <p className="text-gray-300 leading-relaxed">{movie.synopsis}</p>
      </motion.div>

      <motion.div
        className="bg-gray-900 rounded-xl p-6 h-fit"
        variants={itemVariants}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <h3 className="text-xl font-semibold mb-4">Movie Info</h3>
        <dl className="space-y-4">
          {/* <motion.div variants={itemVariants}>
            <dt className="text-gray-400">Director</dt>
            <dd>{movie.director}</dd>
          </motion.div> */}
          <motion.div variants={itemVariants}>
            <dt className="text-gray-400">Release Year</dt>
            <dd>{movie.releaseYear}</dd>
          </motion.div>
          <motion.div variants={itemVariants}>
            <dt className="text-gray-400">Duration</dt>
            <dd>{movie.duration} minutes</dd>
          </motion.div>
          <motion.div variants={itemVariants}>
            <dt className="text-gray-400">Rating</dt>
            <dd className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
              {movie.popularity}/10
            </dd>
          </motion.div>
          <motion.div variants={itemVariants}>
            <dt className="text-gray-400">Genres</dt>
            <dd className="flex flex-wrap gap-1 mt-1">
              {movie.genres.map((genre: string) => (
                <Badge key={genre} variant="secondary" className="bg-gray-800">
                  {genre}
                </Badge>
              ))}
            </dd>
          </motion.div>
        </dl>
      </motion.div>
    </motion.div>
  )
}
