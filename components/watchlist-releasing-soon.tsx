"use client"

import Image from "next/image"
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
  return diff > 0 ? diff : null
}

function urgencyLabel(days: number): string {
  if (days === 1) return "Tomorrow"
  if (days <= 7) return `${days} days`
  if (days <= 14) return "This week"
  if (days <= 30) return "This month"
  return `${days} days`
}

interface WatchlistReleasingSoonProps {
  entries: WatchlistEntry[]
  onCardClick: (entry: WatchlistEntry) => void
}

export function WatchlistReleasingSoon({ entries, onCardClick }: WatchlistReleasingSoonProps) {
  if (entries.length === 0) return null

  // Sort by release date ascending (soonest first)
  const sorted = [...entries].sort((a, b) =>
    (a.movie.release_date ?? "").localeCompare(b.movie.release_date ?? "")
  )

  return (
    <section className="mb-5">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-4 mb-4">
        <div className="flex gap-0.5">
          <div className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          <div className="size-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:150ms]" />
          <div className="size-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:300ms]" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Releasing Soon
        </h3>
        <span className="text-xs text-amber-400/60 font-medium ml-auto">
          {sorted.length} film{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Horizontal scroll strip — bigger cards */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3">
        {sorted.map((entry) => {
          const poster = posterUrl(entry.movie.poster_path, "w500")
          const year = releaseYear(entry.movie.release_date)
          const days = getDaysUntilRelease(entry.movie.release_date)
          const isImminent = days !== null && days <= 7
          const isSoon = days !== null && days <= 30

          return (
            <button
              key={entry.id}
              onClick={() => onCardClick(entry)}
              className="shrink-0 w-[55vw] max-w-[220px] focus:outline-none"
            >
              <div
                className={cn(
                  "relative group rounded-2xl overflow-hidden aspect-[2/3]",
                  "transition-transform duration-300 active:scale-95",
                  isImminent
                    ? "ring-2 ring-amber-400 shadow-[0_0_32px_rgba(251,191,36,0.45)]"
                    : isSoon
                    ? "ring-2 ring-amber-500/70 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                    : "ring-1 ring-amber-500/40"
                )}
              >
                {/* Poster */}
                {poster ? (
                  <Image
                    src={poster}
                    alt={entry.movie.title}
                    fill
                    sizes="220px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary" />
                )}

                {/* Shimmer on hover */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/6 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                {/* Bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

                {/* Amber top tint — stronger for imminent */}
                <div className={cn(
                  "absolute inset-x-0 top-0 h-2/5 pointer-events-none bg-gradient-to-b to-transparent",
                  isImminent ? "from-amber-900/50" : "from-amber-900/25"
                )} />

                {/* Countdown — centred in the amber tint zone */}
                {days !== null && (
                  <div className="absolute top-0 inset-x-0 flex flex-col items-center pt-4 pointer-events-none">
                    <span className={cn(
                      "font-black tabular-nums leading-none",
                      isImminent ? "text-5xl text-amber-300" : "text-4xl text-amber-400"
                    )}>
                      {days}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/80 mt-1">
                      {days === 1 ? "DAY" : "DAYS"}
                    </span>
                  </div>
                )}

                {/* Urgency pill */}
                {days !== null && (
                  <div className={cn(
                    "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide pointer-events-none",
                    isImminent
                      ? "bg-amber-400 text-black animate-pulse"
                      : "bg-amber-500/80 text-black"
                  )}>
                    {urgencyLabel(days)}
                  </div>
                )}

                {/* Bottom content */}
                <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
                  <p className="text-white text-sm font-semibold leading-tight line-clamp-2">
                    {entry.movie.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {entry.movie.release_date && (
                      <p className="text-amber-300/90 text-xs font-medium">
                        {new Date(entry.movie.release_date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </p>
                    )}
                    {year && !entry.movie.release_date && (
                      <p className="text-white/50 text-xs">{year}</p>
                    )}
                  </div>
                </div>

                {/* Inset glow ring */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl pointer-events-none",
                  isImminent
                    ? "shadow-[inset_0_0_30px_rgba(251,191,36,0.22)]"
                    : "shadow-[inset_0_0_18px_rgba(251,191,36,0.10)]"
                )} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 mt-1 h-px bg-border/50" />
    </section>
  )
}
