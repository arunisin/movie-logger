"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useWatchlist } from "@/hooks/use-watchlist"
import { useUIStore } from "@/store/ui-store"
import { WatchlistCard } from "@/components/watchlist-card"
import { WatchlistReleasingSoon } from "@/components/watchlist-releasing-soon"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { WatchlistEntry } from "@/lib/types"
import type { WatchlistFilter } from "@/lib/types"

function getDaysUntilRelease(releaseDate: string | null): number | null {
  if (!releaseDate) return null
  const release = new Date(releaseDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  release.setHours(0, 0, 0, 0)
  const diff = Math.ceil((release.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 ? diff : null // 0 = today
}

const TABS: { value: WatchlistFilter; label: string }[] = [
  { value: "want_to_watch", label: "To Watch" },
  { value: "watched", label: "Watched" },
]

const EMPTY_STATES: Record<
  WatchlistFilter,
  { emoji: string; heading: string; sub: string }
> = {
  all: {
    emoji: "🎬",
    heading: "Your collection is empty",
    sub: "Head to Discover and start building your personal cinema.",
  },
  want_to_watch: {
    emoji: "🍿",
    heading: "Nothing queued up yet",
    sub: "Find films you want to see and add them to your watchlist.",
  },
  watched: {
    emoji: "✅",
    heading: "No films logged yet",
    sub: "Mark films as watched to track what you've seen.",
  },
}

function WatchlistSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] rounded-xl w-full" />
      ))}
    </div>
  )
}

function WatchlistContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openMovieSheet } = useUIStore()

  const tab = (searchParams.get("tab") as WatchlistFilter) ?? "want_to_watch"
  const setTab = (t: WatchlistFilter) =>
    router.replace(`/watchlist?tab=${t}`, { scroll: false })

  const { data: entries = [], isLoading } = useWatchlist()

  // Releasing soon: want_to_watch entries with release in the next 60 days
  const releasingSoon = useMemo(
    () =>
      entries.filter((e) => {
        if (e.status !== "want_to_watch" || !e.movie.release_date) return false
        const days = getDaysUntilRelease(e.movie.release_date)
        return days !== null && days <= 90
      }),
    [entries]
  )

  // Main grid: filtered by tab, exclude releasing-soon items from non-watched views
  const filteredEntries = useMemo(() => {
    let list = entries
    if (tab === "want_to_watch") list = list.filter((e) => e.status === "want_to_watch")
    if (tab === "watched") list = list.filter((e) => e.status === "watched")
    // Don't show releasing-soon items twice (only exclude when not in "watched" tab)
    if (tab !== "watched") {
      const soonIds = new Set(releasingSoon.map((e) => e.id))
      list = list.filter((e) => !soonIds.has(e.id))
    }
    return list
  }, [entries, tab, releasingSoon])

  const watchedCount = entries.filter((e) => e.status === "watched").length
  const toWatchCount = entries.filter((e) => e.status === "want_to_watch").length

  const handleCardClick = (entry: WatchlistEntry) => {
    openMovieSheet(entry.movie)
  }

  const emptyState = EMPTY_STATES[tab]

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">My Watchlist</h1>
          {!isLoading && (
            <div className="flex gap-1.5">
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                {watchedCount} watched
              </span>
              <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
                {toWatchCount} to watch
              </span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                tab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 py-4 space-y-4">
        {isLoading ? (
          <WatchlistSkeletons />
        ) : entries.length === 0 || (filteredEntries.length === 0 && (tab === "watched" || releasingSoon.length === 0)) ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 px-6 gap-3 text-center">
            <span className="text-5xl" aria-hidden="true">
              {emptyState.emoji}
            </span>
            <h2 className="text-base font-semibold text-foreground">
              {emptyState.heading}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              {emptyState.sub}
            </p>
            <Link
              href="/discover"
              className="mt-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Discover
            </Link>
          </div>
        ) : (
          <>
            {/* Releasing soon strip — only in "all" and "want_to_watch" tabs */}
            {tab !== "watched" && releasingSoon.length > 0 && (
              <WatchlistReleasingSoon
                entries={releasingSoon}
                onCardClick={handleCardClick}
              />
            )}

            {/* Main 2-col poster grid */}
            {filteredEntries.length > 0 && (
              <div className="grid grid-cols-2 gap-3 px-4">
                {filteredEntries.map((entry) => (
                  <WatchlistCard
                    key={entry.id}
                    entry={entry}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}

            {/* If filtered grid is empty but the releasing-soon section is shown */}
            {filteredEntries.length === 0 && tab === "want_to_watch" && releasingSoon.length > 0 && (
              <p className="text-center text-sm text-muted-foreground px-4">
                All your to-watch films are releasing soon — see above!
              </p>
            )}
          </>
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
