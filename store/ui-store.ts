import { create } from "zustand"
import type { TMDBMovie, Movie, WatchlistFilter } from "@/lib/types"

type SheetMovie = TMDBMovie | Movie

interface UIStore {
  selectedMovie: SheetMovie | null
  sheetOpen: boolean
  watchlistFilter: WatchlistFilter
  openMovieSheet: (movie: SheetMovie) => void
  closeMovieSheet: () => void
  setWatchlistFilter: (filter: WatchlistFilter) => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedMovie: null,
  sheetOpen: false,
  watchlistFilter: "all",

  openMovieSheet: (movie) => set({ selectedMovie: movie, sheetOpen: true }),
  closeMovieSheet: () => set({ sheetOpen: false }),
  setWatchlistFilter: (filter) => set({ watchlistFilter: filter }),
}))
