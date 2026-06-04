"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { WatchlistItem } from "@/components/watchlist-item"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWatchlist } from "@/hooks/use-watchlist"
import type { WatchlistFilter } from "@/lib/types"

function WatchlistSkeletons() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-border">
          <Skeleton className="w-12 h-[72px] rounded shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

const EMPTY_MESSAGES: Record<WatchlistFilter, string> = {
  all: "Your watchlist is empty. Head to Discover to add movies!",
  want_to_watch: "No movies on your to-watch list. Head to Discover to add some!",
  watched: "You haven't marked any movies as watched yet.",
}

function WatchlistContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: entries, isLoading } = useWatchlist()

  const tab = (searchParams.get('tab') as WatchlistFilter) ?? 'all'
  const setTab = (t: WatchlistFilter) =>
    router.replace(`/watchlist?tab=${t}`, { scroll: false })

  const wantToWatch = entries?.filter((e) => e.status === "want_to_watch") ?? []
  const watched = entries?.filter((e) => e.status === "watched") ?? []

  const filteredEntries =
    tab === "want_to_watch"
      ? wantToWatch
      : tab === "watched"
      ? watched
      : entries ?? []

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">My Watchlist</h1>
          <div className="flex items-center gap-1.5">
            {!isLoading && (
              <>
                <Badge variant="secondary" className="text-xs gap-1">
                  <span className="text-primary font-bold">{wantToWatch.length}</span>
                  to watch
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1">
                  <span className="text-primary font-bold">{watched.length}</span>
                  watched
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as WatchlistFilter)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="want_to_watch" className="flex-1 text-xs">
              To Watch
            </TabsTrigger>
            <TabsTrigger value="watched" className="flex-1 text-xs">
              Watched
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* List content */}
      <div className="px-4">
        {isLoading ? (
          <WatchlistSkeletons />
        ) : filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <WatchlistItem key={entry.id} entry={entry} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-4xl" aria-hidden="true">
              {tab === "watched" ? "✅" : "🎬"}
            </span>
            <p className="text-muted-foreground text-sm max-w-xs">
              {EMPTY_MESSAGES[tab]}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WatchlistPage() {
  return (
    <Suspense>
      <WatchlistContent />
    </Suspense>
  )
}
