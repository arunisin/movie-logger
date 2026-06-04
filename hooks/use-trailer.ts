"use client"

import { useQuery } from "@tanstack/react-query"

export interface TrailerData {
  key: string
  watchUrl: string
  embedUrl: string
}

export function useTrailer(movieId: number | null) {
  return useQuery<TrailerData | null>({
    queryKey: ["trailer", movieId],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/movie/${movieId}/videos`)
      if (!res.ok) return null
      const data = await res.json()
      const first = data.trailers?.[0]
      if (!first) return null
      return {
        key: first.key as string,
        watchUrl: `https://www.youtube.com/watch?v=${first.key}`,
        embedUrl: `https://www.youtube.com/embed/${first.key}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&loop=1&playlist=${first.key}`,
      }
    },
    enabled: movieId !== null,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  })
}
