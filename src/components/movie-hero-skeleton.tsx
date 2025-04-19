import { Skeleton } from "@/components/ui/Skeleton"

export default function MovieHeroSkeleton() {
  return (
    <div
      className="relative w-full bg-gray-900"
      style={{
        height: "min(70vh, 700px)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 w-full p-4 sm:p-6 z-10 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Poster Skeleton */}
          <div className="hidden md:block w-36 lg:w-48 h-auto aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-gray-800 flex-shrink-0">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Movie Info Skeleton */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>

            <Skeleton className="h-10 w-3/4 mb-2" />

            <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-1.5 w-48" />
            </div>

            <Skeleton className="h-20 w-full max-w-2xl mb-6" />

            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
