"use client"

import type { ReactNode } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { MovieDetailSheet } from "@/components/movie-detail-sheet"
import { useUIStore } from "@/store/ui-store"

export default function AppLayout({ children }: { children: ReactNode }) {
  const { selectedMovie, sheetOpen, closeMovieSheet } = useUIStore()

  return (
    <>
      <main className="min-h-dvh pb-20">{children}</main>
      <BottomNav />
      <MovieDetailSheet
        movie={selectedMovie}
        open={sheetOpen}
        onOpenChange={(o) => !o && closeMovieSheet()}
      />
    </>
  )
}
