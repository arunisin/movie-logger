import { create } from "zustand"
import type { TMDBMovie, Movie } from "@/lib/types"

type SheetMovie = TMDBMovie | Movie

interface UIStore {
  selectedMovie: SheetMovie | null
  sheetOpen: boolean
  openMovieSheet: (movie: SheetMovie) => void
  closeMovieSheet: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedMovie: null,
  sheetOpen: false,

  openMovieSheet: (movie) => set({ selectedMovie: movie, sheetOpen: true }),
  closeMovieSheet: () => set({ sheetOpen: false }),
}))
