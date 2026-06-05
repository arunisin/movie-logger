import { Skeleton } from "@/components/ui/skeleton"

export default function WatchlistLoading() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 border-b border-border/50 px-4 pt-4-safe pb-3">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-7 w-36 rounded-lg" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      <div className="py-4 space-y-4">
        {/* Releasing soon strip */}
        <div className="mb-2">
          <div className="flex items-center gap-2.5 px-4 mb-4">
            <Skeleton className="size-1.5 rounded-full" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <div className="flex gap-3 px-4 overflow-hidden">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="shrink-0 w-[55vw] max-w-[220px] aspect-[2/3] rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
