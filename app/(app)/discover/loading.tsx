import { Skeleton } from "@/components/ui/skeleton"

export default function DiscoverLoading() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 border-b border-border/50 pt-safe">
        <div className="flex items-center px-4 pt-4 pb-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        {/* Search bar */}
        <div className="px-4 pb-3">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
        {/* Filter chips */}
        <div className="px-4 pb-3 flex flex-col gap-2">
          <div className="flex gap-2 overflow-hidden">
            {[72, 56, 64, 56, 60, 52].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-full shrink-0" style={{ width: w }} />
            ))}
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[80, 76, 68, 72].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-full shrink-0" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <Skeleton className="h-3 w-20 rounded" />
      </div>

      {/* Movie grid */}
      <div className="grid grid-cols-2 gap-3 p-4 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
