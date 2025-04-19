import { Skeleton } from "@/components/ui/skeleton"

export default function MovieCastTabSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full mb-3" />
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
