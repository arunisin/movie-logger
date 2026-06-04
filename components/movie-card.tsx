"use client"

import Image from "next/image"
import { Eye, Plus, Check } from "lucide-react"
import { posterUrl } from "@/lib/tmdb"
import type { TMDBMovie, Movie } from "@/lib/types"
import { useWatchlistStatus } from "@/hooks/use-watchlist"
import { cn } from "@/lib/utils"

type MovieLike = TMDBMovie | Movie

interface MovieCardProps {
  movie: MovieLike
  onClick?: () => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const status = useWatchlistStatus(movie.id)
  const poster = posterUrl(movie.poster_path, "w342")

  return (
    <button
      onClick={onClick}
      className="group relative w-full cursor-pointer rounded-lg overflow-hidden bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="aspect-[2/3] w-full relative">
        {poster ? (
          <Image
            src={poster}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Eye className="text-muted-foreground size-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="text-xs text-white font-medium px-2 text-center line-clamp-3">
            {movie.title}
          </span>
        </div>
        {status && (
          <div
            className={cn(
              "absolute top-1.5 right-1.5 size-5 rounded-full flex items-center justify-center shadow",
              status === "watched"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            )}
          >
            {status === "watched" ? (
              <Check className="size-3" />
            ) : (
              <Plus className="size-3" />
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate px-1 py-1.5 text-left">
        {movie.title}
      </p>
    </button>
  )
}
