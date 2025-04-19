"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type CastMember = {
  name: string
  role: string
  image?: string
}

type MovieCastTabProps = {
  cast: CastMember[]
}

export default function MovieCastTab({ cast }: MovieCastTabProps) {
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
        Cast & Crew
      </motion.h2>
      <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {cast.map((person, index) => (
          <motion.div
            key={person.name}
            className="flex flex-col items-center text-center"
            variants={itemVariants}
            custom={index}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mb-3">
              <AvatarImage src={person.image || "/placeholder.svg"} alt={person.name} />
              <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold">{person.name}</h3>
            <p className="text-sm text-gray-400">{person.role}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
