"use client";

import { useQuery } from "@tanstack/react-query";
import type { TMDBMovie } from "@/lib/types";

export function useTrendingMovies() {
  return useQuery({
    queryKey: ["movies", "trending"],
    queryFn: async (): Promise<TMDBMovie[]> => {
      const res = await fetch("/api/tmdb/trending");
      if (!res.ok) throw new Error("Failed to fetch trending movies");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

export function useSearchMovies(query: string) {
  return useQuery({
    queryKey: ["movies", "search", query],
    queryFn: async (): Promise<TMDBMovie[]> => {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search movies");
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
