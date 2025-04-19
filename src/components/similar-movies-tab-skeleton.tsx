import { Skeleton } from "@/components/ui/Skeleton"

export default function SimilarMoviesTabSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="group cursor-pointer">
            <Skeleton className="aspect-[2/3] rounded-lg mb-2" />
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
