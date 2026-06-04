"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { WatchlistEntry, TMDBMovie } from "@/lib/types"
import { releaseYear } from "@/lib/tmdb"

interface WatchlistContextValue {
  entries: WatchlistEntry[]
  loading: boolean
  getStatus: (tmdbId: number) => WatchlistEntry["status"] | null
  addToWatchlist: (movie: TMDBMovie) => Promise<void>
  markWatched: (tmdbId: number) => Promise<void>
  removeFromWatchlist: (tmdbId: number) => Promise<void>
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null)

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase
      .from("watchlist")
      .select("*")
      .order("added_at", { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  const getStatus = useCallback(
    (tmdbId: number): WatchlistEntry["status"] | null => {
      const entry = entries.find((e) => e.tmdb_id === tmdbId)
      return entry?.status ?? null
    },
    [entries]
  )

  const addToWatchlist = useCallback(
    async (movie: TMDBMovie) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const entry: Omit<WatchlistEntry, "id" | "added_at" | "watched_at"> = {
        user_id: user.id,
        tmdb_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_year: releaseYear(movie.release_date),
        overview: movie.overview,
        vote_average: movie.vote_average,
        status: "want_to_watch",
      }

      const { data } = await supabase
        .from("watchlist")
        .insert(entry)
        .select()
        .single()

      if (data) {
        setEntries((prev) => [data, ...prev])
      }
    },
    [supabase]
  )

  const markWatched = useCallback(
    async (tmdbId: number) => {
      const { data } = await supabase
        .from("watchlist")
        .update({ status: "watched", watched_at: new Date().toISOString() })
        .eq("tmdb_id", tmdbId)
        .select()
        .single()

      if (data) {
        setEntries((prev) => prev.map((e) => (e.tmdb_id === tmdbId ? data : e)))
      }
    },
    [supabase]
  )

  const removeFromWatchlist = useCallback(
    async (tmdbId: number) => {
      await supabase.from("watchlist").delete().eq("tmdb_id", tmdbId)
      setEntries((prev) => prev.filter((e) => e.tmdb_id !== tmdbId))
    },
    [supabase]
  )

  return (
    <WatchlistContext.Provider
      value={{ entries, loading, getStatus, addToWatchlist, markWatched, removeFromWatchlist }}
    >
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider")
  return ctx
}
