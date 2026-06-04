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

interface WatchlistReleasingSoonProps {
  entries: WatchlistEntry[]
  onCardClick: (entry: WatchlistEntry) => void
}

export function WatchlistReleasingSoon({ entries, onCardClick }: WatchlistReleasingSoonProps) {
  if (entries.length === 0) return null

  return (
    <section className="mb-2">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <div className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Releasing Soon
        </h3>
      </div>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
        {entries.map((entry) => {
          const poster = posterUrl(entry.movie.poster_path, "w342")
          const year = releaseYear(entry.movie.release_date)
          const days = getDaysUntilRelease(entry.movie.release_date)
          const isImminent = days !== null && days <= 7

          return (
            <div
              key={entry.id}
              className="shrink-0 w-[42vw] max-w-[160px]"
            >
              <div
                className={cn(
                  "relative group cursor-pointer rounded-xl overflow-hidden aspect-[2/3]",
                  "ring-2 ring-amber-500/60",
                  isImminent
                    ? "ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.35)] animate-pulse-slow"
                    : "shadow-[0_0_14px_rgba(251,191,36,0.18)]"
                )}
                onClick={() => onCardClick(entry)}
              >
                {/* Poster */}
                {poster ? (
                  <Image
                    src={poster}
                    alt={entry.movie.title}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary" />
                )}

                {/* Shimmer effect on hover */}
                <div
                  className={cn(
                    "absolute inset-0 pointer-events-none",
                    "bg-gradient-to-r from-transparent via-white/5 to-transparent",
                    "-translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  )}
                />

                {/* Full gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

                {/* Amber top tint */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-amber-900/30 to-transparent pointer-events-none" />

                {/* Countdown — prominent at top */}
                {days !== null && (
                  <div className="absolute top-0 inset-x-0 flex flex-col items-center pt-3 pointer-events-none">
                    <span
                      className={cn(
                        "text-2xl font-black tabular-nums leading-none",
                        isImminent ? "text-amber-300" : "text-amber-400"
                      )}
                    >
                      {days}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/80 mt-0.5">
                      DAYS
                    </span>
                  </div>
                )}

                {/* Bottom content */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 pointer-events-none">
                  <p className="text-white text-xs font-semibold leading-tight line-clamp-2">
                    {entry.movie.title}
                  </p>
                  {year && (
                    <p className="text-white/50 text-[10px] mt-0.5">{year}</p>
                  )}
                </div>

                {/* Inset ring glow */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl ring-2 pointer-events-none",
                    isImminent
                      ? "ring-amber-400 shadow-[inset_0_0_24px_rgba(251,191,36,0.20)]"
                      : "ring-amber-500/50 shadow-[inset_0_0_14px_rgba(251,191,36,0.10)]"
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
