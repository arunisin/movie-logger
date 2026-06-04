"use client"

import { useQuery } from "@tanstack/react-query"

export function useTrailer(movieId: number | null) {
  return useQuery({
    queryKey: ["trailer", movieId],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/movie/${movieId}/videos`)
      if (!res.ok) return null
      const data = await res.json()
      const first = data.trailers?.[0]
      return first ? `https://www.youtube.com/watch?v=${first.key}` : null
    },
    enabled: movieId !== null,
    staleTime: 1000 * 60 * 60 * 24, // trailers don't change
    gcTime: 1000 * 60 * 60 * 24,
  })
}
