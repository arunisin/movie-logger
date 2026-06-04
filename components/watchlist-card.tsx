"use client"

import Image from "next/image"
import { Check, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { posterUrl, releaseYear } from "@/lib/tmdb"
import type { WatchlistEntry } from "@/lib/types"

function getDaysUntilRelease(releaseDate: string | null): number | null {
  if (!releaseDate) return null
  const release = new Date(releaseDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  release.setHours(0, 0, 0, 0)
  const diff = Math.ceil((release.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 ? diff : null // 0 = today
}

function getHypeBadge(pop: number | null, rating: number | null): string | null {
  const p = pop ?? 0
  const r = rating ?? 0
  if (r >= 8.5) return "👑"
  if (p > 400) return "🔥🔥"
  if (p > 200 || r >= 8.0) return "🔥"
  if (p > 100) return "⚡"
  if (p > 50 && r >= 7.5) return "💎"
  return null
}

interface WatchlistCardProps {
  entry: WatchlistEntry
  onClick?: (entry: WatchlistEntry) => void
}

export function WatchlistCard({ entry, onClick }: WatchlistCardProps) {
  const poster = posterUrl(entry.movie.poster_path, "w342")
  const year = releaseYear(entry.movie.release_date)
  const days = getDaysUntilRelease(entry.movie.release_date)

  const isToday = days === 0
  const isImminent = days !== null && days <= 7
  const isSoon = days !== null && days <= 30
  const hype = getHypeBadge(entry.movie.popularity, entry.movie.vote_average)

  return (
    <div
      className={cn(
        "relative group cursor-pointer rounded-xl overflow-hidden aspect-[2/3] bg-card shimmer",
        // amber glow ring for upcoming
        isSoon && "ring-2",
        isImminent
          ? "ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.25)]"
          : isSoon
          ? "ring-amber-500/50"
          : ""
      )}
      onClick={() => onClick?.(entry)}
    >
      {/* Poster image */}
      {poster ? (
        <Image
          src={poster}
          alt={entry.movie.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          <Bookmark className="size-8 text-muted-foreground/40" />
        </div>
      )}

      {/* Bottom gradient overlay — always visible */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Imminent glow overlay */}
      {isImminent && (
        <div className="absolute inset-0 bg-amber-400/5 pointer-events-none" />
      )}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
        <p className="text-white text-sm font-semibold leading-tight line-clamp-2">
          {entry.movie.title}
        </p>
        {year && (
          <p className="text-white/60 text-xs mt-0.5">{year}</p>
        )}
      </div>

      {/* Top-right: status icon */}
      {entry.status === "watched" ? (
        <div className="absolute top-2 right-2 size-6 rounded-full bg-primary/90 flex items-center justify-center shadow-md">
          <Check className="size-3.5 text-primary-foreground" />
        </div>
      ) : (
        <div className="absolute top-2 right-2 size-6 rounded-full bg-black/50 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          <Bookmark className="size-3.5 text-white/80" />
        </div>
      )}

      {/* Top-left: hype badge (only when no countdown) */}
      {hype && !isSoon && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-sm leading-none bg-black/50 backdrop-blur-sm shadow">
          {hype}
        </div>
      )}

      {/* Top-left: countdown chip (only for upcoming) */}
      {isSoon && days !== null && (
        <div
          className={cn(
            "absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold tracking-wide shadow-md",
            isToday
              ? "bg-white text-black animate-pulse"
              : isImminent
              ? "bg-amber-500 text-black animate-pulse"
              : "bg-amber-500/80 text-black"
          )}
        >
          {isToday ? "TODAY" : `${days}d`}
        </div>
      )}

      {/* Releasing soon inset glow ring */}
      {isSoon && (
        <div
          className={cn(
            "absolute inset-0 rounded-xl ring-2 pointer-events-none",
            isImminent
              ? "ring-amber-400 shadow-[inset_0_0_20px_rgba(251,191,36,0.15)]"
              : "ring-amber-500/50"
          )}
        />
      )}
    </div>
  )
}
