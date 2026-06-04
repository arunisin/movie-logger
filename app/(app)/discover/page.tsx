"use client"

import { Suspense, useMemo, useCallback, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MovieCard } from "@/components/movie-card"
import { SearchBar } from "@/components/search-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { DiscoverFilters } from "@/components/discover-filters"
import type { DiscoverSort, DiscoverLang } from "@/components/discover-filters"
import { useTrendingMovies, useSearchMovies, useDiscoverMovies } from "@/hooks/use-movies"
import { useWatchlist } from "@/hooks/use-watchlist"
import { useUIStore } from "@/store/ui-store"
import { useDebounce } from "@/hooks/use-debounce"

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

const LANG_LABELS: Record<string, string> = { hi: "Hindi", ta: "Tamil", ml: "Malayalam" }

function DiscoverContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openMovieSheet } = useUIStore()

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  const debouncedSearch = useDebounce(searchInput, 400)

  const discoverGenre = searchParams.get("genre") ? Number(searchParams.get("genre")) : null
  const discoverSort = (searchParams.get("sort") as DiscoverSort) ?? "trending"
  const discoverLang = (searchParams.get("lang") as DiscoverLang) ?? null

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key)
        else params.set(key, value)
      })
      router.replace(`/discover?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  useEffect(() => {
    updateParams({ q: debouncedSearch || null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const isSearching = debouncedSearch.length >= 2

  // When a language is selected, use discover API (server-side genre+sort+lang)
  // Otherwise use trending (cached Supabase data) with client-side filter/sort
  const trending = useTrendingMovies()
  const searchResults = useSearchMovies(debouncedSearch)
  const langResults = useDiscoverMovies(discoverLang, discoverSort, discoverGenre)

  const rawMovies = isSearching
    ? searchResults.data
    : discoverLang
    ? langResults.data
    : trending.data

  const isLoading = isSearching
    ? searchResults.isLoading
    : discoverLang
    ? langResults.isLoading
    : trending.isLoading

  const { data: watchlistEntries } = useWatchlist()
  const getStatus = useCallback(
    (id: number) => watchlistEntries?.find((e) => e.movie_id === id)?.status ?? null,
    [watchlistEntries]
  )

  const filteredMovies = useMemo(() => {
    let list = rawMovies ?? []

    // Filter out "not interested"
    list = list.filter((m) => getStatus(m.id) !== "not_interested")

    // When using the discover API, genre+sort are applied server-side
    // Only apply client-side for trending (no lang selected)
    if (!isSearching && !discoverLang) {
      if (discoverGenre !== null) {
        list = list.filter((m) => m.genre_ids?.includes(discoverGenre))
      }
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
      }
    }

    return list
  }, [rawMovies, discoverGenre, discoverSort, discoverLang, getStatus, isSearching])

  const sectionLabel = isSearching
    ? `Results for "${debouncedSearch}"`
    : discoverLang
    ? `${LANG_LABELS[discoverLang] ?? discoverLang} Films`
    : "Trending"

  const isFilterActive = !isSearching && (discoverGenre !== null || discoverLang !== null)

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="flex items-center px-4 pt-4 pb-2">
          <span className="text-xl font-bold text-primary tracking-tight">Filmlog</span>
        </div>
        <div className="px-4 pb-3">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search movies…"
          />
        </div>
        {!isSearching && (
          <DiscoverFilters
            genre={discoverGenre}
            sort={discoverSort}
            lang={discoverLang}
            onGenreChange={(g) => updateParams({ genre: g ? String(g) : null })}
            onSortChange={(s) => updateParams({ sort: s === "trending" ? null : s })}
            onLangChange={(l) => updateParams({ lang: l ?? null })}
          />
        )}
      </header>

      <div className="px-4 pt-4 pb-1 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {sectionLabel}
        </h2>
        {isFilterActive && (
          <span className="text-xs bg-primary/20 text-primary px-1.5 rounded-full">
            {filteredMovies.length} shown
          </span>
        )}
      </div>

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
            ) : (rawMovies ?? []).length > 0 ? (
              <>
                <p className="text-muted-foreground text-sm text-center">
                  No movies match your filters.
                </p>
                <button
                  onClick={() => updateParams({ genre: null, sort: null, lang: null })}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">
                Nothing here right now.
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
