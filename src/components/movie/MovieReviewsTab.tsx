"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/Avatar"

type Review = {
  author: string
  text: string
}

type MovieReviewsTabProps = {
  reviews: Review[]
}

export default function MovieReviewsTab({ reviews }: MovieReviewsTabProps) {
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        variants={itemVariants}
      >
        <h2 className="text-2xl font-bold">Reviews</h2>
        
      </motion.div>

      <motion.div className="space-y-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.author + review.text.slice(0, 10)}
            className="bg-gray-900 rounded-xl p-4 sm:p-6"
            variants={itemVariants}
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="text-white">{review.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{review.author}</h3>
                  {/* <p className="text-sm text-gray-400">{review.date}</p> */}
                </div>
              </div>
              {/* <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                  />
                ))}
              </div> */}
            </div>
            <p className="text-gray-300">{review?.text || review as any}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
