"use client"

import Image from "next/image"
import { Check, X } from "lucide-react"
import { posterUrl, releaseYear } from "@/lib/tmdb"
import type { WatchlistEntry } from "@/lib/types"
import { useMarkWatched, useRemoveFromWatchlist } from "@/hooks/use-watchlist"
import { Button } from "@/components/ui/button"

interface WatchlistItemProps {
  entry: WatchlistEntry
}

export function WatchlistItem({ entry }: WatchlistItemProps) {
  const markWatched = useMarkWatched()
  const removeFromWatchlist = useRemoveFromWatchlist()

  const poster = posterUrl(entry.movie.poster_path, "w342")
  const year = releaseYear(entry.movie.release_date)

  return (
    <div className="flex flex-row items-center gap-3 py-3 border-b border-border">
      {/* Poster thumbnail */}
      <div className="w-12 aspect-[2/3] rounded overflow-hidden relative shrink-0 bg-secondary">
        {poster ? (
          <Image
            src={poster}
            alt={entry.movie.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : null}
      </div>

      {/* Middle content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{entry.movie.title}</p>
        {year && (
          <p className="text-xs text-muted-foreground">{year}</p>
        )}
        {entry.status === "watched" ? (
          <p className="text-xs text-primary mt-0.5">Watched ✓</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">To watch</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {entry.status === "want_to_watch" && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mark as watched"
            onClick={() => markWatched.mutate(entry.movie_id)}
            disabled={markWatched.isPending}
          >
            <Check className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove from watchlist"
          onClick={() => removeFromWatchlist.mutate(entry.movie_id)}
          disabled={removeFromWatchlist.isPending}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
