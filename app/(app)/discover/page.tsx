"use client"

import { useState } from "react"
import { MovieCard } from "@/components/movie-card"
import { SearchBar } from "@/components/search-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrendingMovies, useSearchMovies } from "@/hooks/use-movies"
import { useUIStore } from "@/store/ui-store"

function MovieGridSkeletons() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-3 w-3/4 rounded" />
        </div>
      ))}
    </>
  )
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { openMovieSheet } = useUIStore()

  const isSearching = searchQuery.length >= 2

  const trending = useTrendingMovies()
  const searchResults = useSearchMovies(searchQuery)

  const movies = isSearching ? searchResults.data : trending.data
  const isLoading = isSearching ? searchResults.isLoading : trending.isLoading

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center px-4 pt-4 pb-2">
          <span className="text-xl font-bold text-primary tracking-tight">Filmlog</span>
        </div>
        <div className="px-4 pb-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search movies…"
          />
        </div>
      </header>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isSearching ? `Results for "${searchQuery}"` : "Trending"}
        </h2>
      </div>

      {/* Movie grid */}
      <div className="grid grid-cols-2 gap-3 p-4 pt-2">
        {isLoading ? (
          <MovieGridSkeletons />
        ) : movies && movies.length > 0 ? (
          movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => openMovieSheet(movie)}
            />
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl" aria-hidden="true">🎬</span>
            <p className="text-muted-foreground text-sm text-center">
              {isSearching ? "No movies found." : "Nothing trending right now."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
