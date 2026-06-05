import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 bg-background/95 border-b border-border/50 px-4 pt-4-safe pb-3">
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>

      <div className="px-4 py-5 flex flex-col gap-6">
        {/* User card */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <Skeleton className="size-14 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>

        {/* Settings card */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 flex items-center justify-between border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>

        {/* Sign out button */}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
