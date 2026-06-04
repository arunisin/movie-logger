"use client"

import { Suspense, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MovieCard } from "@/components/movie-card"
import { SearchBar } from "@/components/search-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { DiscoverFilters } from "@/components/discover-filters"
import type { DiscoverSort } from "@/components/discover-filters"
import { useTrendingMovies, useSearchMovies } from "@/hooks/use-movies"
import { useWatchlist } from "@/hooks/use-watchlist"
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

function DiscoverContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openMovieSheet } = useUIStore()

  const searchQuery = searchParams.get('q') ?? ''
  const discoverGenre = searchParams.get('genre') ? Number(searchParams.get('genre')) : null
  const discoverSort = (searchParams.get('sort') as DiscoverSort) ?? 'trending'

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    })
    router.replace(`/discover?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const isSearching = searchQuery.length >= 2

  const trending = useTrendingMovies()
  const searchResults = useSearchMovies(searchQuery)

  const movies = isSearching ? searchResults.data : trending.data
  const isLoading = isSearching ? searchResults.isLoading : trending.isLoading

  const { data: watchlistEntries } = useWatchlist()
  const getStatus = useCallback(
    (id: number) => watchlistEntries?.find((e) => e.movie_id === id)?.status ?? null,
    [watchlistEntries]
  )

  const filteredMovies = useMemo(() => {
    let list = movies ?? []

    // Filter out "not interested" movies
    list = list.filter((m) => getStatus(m.id) !== "not_interested")

    // Genre filter (only when not searching)
    if (!isSearching && discoverGenre !== null) {
      list = list.filter((m) => m.genre_ids?.includes(discoverGenre))
    }

    // Sort (only when not searching)
    if (!isSearching) {
      switch (discoverSort) {
        case "rating":
          list = [...list].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          break
        case "newest":
          list = [...list].sort((a, b) =>
            (b.release_date ?? "").localeCompare(a.release_date ?? "")
          )
          break
        case "popular":
          list = [...list].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
          break
        // 'trending' = default API order
      }
    }

    return list
  }, [movies, discoverGenre, discoverSort, getStatus, isSearching])

  const isFilterActive = !isSearching && discoverGenre !== null

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
            onChange={(v) => updateParams({ q: v || null })}
            placeholder="Search movies…"
          />
        </div>
        {!isSearching && (
          <DiscoverFilters
            genre={discoverGenre}
            sort={discoverSort}
            onGenreChange={(g) => updateParams({ genre: g ? String(g) : null })}
            onSortChange={(s) => updateParams({ sort: s === 'trending' ? null : s })}
          />
        )}
      </header>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isSearching ? `Results for "${searchQuery}"` : "Trending"}
        </h2>
        {isFilterActive && (
          <span className="text-xs bg-primary/20 text-primary px-1.5 rounded-full">
            {filteredMovies.length} shown
          </span>
        )}
      </div>

      {/* Movie grid */}
      <div className="grid grid-cols-2 gap-3 p-4 pt-2">
        {isLoading ? (
          <MovieGridSkeletons />
        ) : filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => openMovieSheet(movie)}
            />
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl" aria-hidden="true">🎬</span>
            {isSearching ? (
              <p className="text-muted-foreground text-sm text-center">No movies found.</p>
            ) : (movies ?? []).length > 0 ? (
              <>
                <p className="text-muted-foreground text-sm text-center">
                  No movies match your filters.
                </p>
                <button
                  onClick={() => updateParams({ genre: null, sort: null })}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">
                Nothing trending right now.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverContent />
    </Suspense>
  )
}
