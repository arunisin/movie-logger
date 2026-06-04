"use client"

import { Drawer } from "vaul"
import Image from "next/image"
import { X, Plus, Check, BookmarkCheck, Bookmark, Star } from "lucide-react"
import { posterUrl, backdropUrl, releaseYear } from "@/lib/tmdb"
import type { TMDBMovie, Movie } from "@/lib/types"
import {
  useWatchlistStatus,
  useAddToWatchlist,
  useMarkWatched,
  useRemoveFromWatchlist,
} from "@/hooks/use-watchlist"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
  10752: "War", 37: "Western",
}

interface MovieDetailSheetProps {
  movie: TMDBMovie | Movie | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MovieDetailSheet({ movie, open, onOpenChange }: MovieDetailSheetProps) {
  const status = useWatchlistStatus(movie?.id ?? 0)
  const addMutation = useAddToWatchlist()
  const watchedMutation = useMarkWatched()
  const removeMutation = useRemoveFromWatchlist()

  if (!movie) return null

  const poster = posterUrl(movie.poster_path, "w500")
  const backdrop = backdropUrl(movie.backdrop_path)
  const year = releaseYear(movie.release_date)
  const rating = movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null

  const handleAdd = () => {
    addMutation.mutate(movie)
  }

  const handleMarkWatchedDirectly = async () => {
    if (status === null) await addMutation.mutateAsync(movie)
    await watchedMutation.mutateAsync(movie.id)
  }

  const handleMarkWatched = () => {
    if (status === "want_to_watch") {
      watchedMutation.mutate(movie.id)
    } else {
      void handleMarkWatchedDirectly()
    }
  }

  const handleRemove = () => {
    removeMutation.mutate(movie.id)
  }

  const isLoading =
    addMutation.isPending || watchedMutation.isPending || removeMutation.isPending

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/70 z-40" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "flex flex-col rounded-t-2xl overflow-hidden",
            "bg-card max-h-[92dvh]"
          )}
        >
          {/* drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 size-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="size-4" />
          </button>

          <div className="overflow-y-auto flex-1">
            {/* backdrop hero */}
            {backdrop && (
              <div className="relative h-44 w-full shrink-0">
                <Image
                  src={backdrop}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-card" />
              </div>
            )}

            <div className={cn("px-4 pb-8", backdrop ? "-mt-16" : "pt-2")}>
              <div className="flex gap-4">
                {/* poster */}
                <div className="shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden shadow-xl relative">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>

                {/* meta */}
                <div className="flex-1 min-w-0 pt-2">
                  <h2 className="text-lg font-semibold leading-tight line-clamp-2">
                    {movie.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {year && (
                      <span className="text-sm text-muted-foreground">{year}</span>
                    )}
                    {rating !== null && (
                      <div className="flex items-center gap-0.5 text-sm text-yellow-400">
                        <Star className="size-3 fill-current" />
                        <span>{rating}</span>
                      </div>
                    )}
                  </div>

                  {/* genres */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {movie.genre_ids.slice(0, 3).map((id) => (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-xs px-1.5 py-0.5"
                      >
                        {GENRE_MAP[id] ?? id}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* overview */}
              {movie.overview && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {movie.overview}
                </p>
              )}

              {/* action buttons */}
              <div className="flex gap-2 mt-5">
                {status === null ? (
                  <>
                    <Button
                      className="flex-1 gap-2 rounded-xl"
                      onClick={handleAdd}
                      disabled={isLoading}
                    >
                      <Bookmark className="size-4" />
                      Watchlist
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 rounded-xl"
                      onClick={handleMarkWatched}
                      disabled={isLoading}
                    >
                      <Check className="size-4" />
                      Watched
                    </Button>
                  </>
                ) : status === "want_to_watch" ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 rounded-xl border-accent/50 text-accent"
                      onClick={handleMarkWatched}
                      disabled={isLoading}
                    >
                      <Check className="size-4" />
                      Mark Watched
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-muted-foreground"
                      onClick={handleRemove}
                      disabled={isLoading}
                    >
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                      <BookmarkCheck className="size-4" />
                      Watched
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-muted-foreground"
                      onClick={handleRemove}
                      disabled={isLoading}
                    >
                      <X className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
