"use client";

import { useQuery } from "@tanstack/react-query";
import type { TMDBMovie } from "@/lib/types";
import type { DiscoverSort } from "@/components/discover-filters";

export function useTrendingMovies() {
  return useQuery({
    queryKey: ["movies", "trending"],
    queryFn: async (): Promise<TMDBMovie[]> => {
      const res = await fetch("/api/tmdb/trending");
      if (!res.ok) throw new Error("Failed to fetch trending movies");
      const data = await res.json();
      return data.results ?? [];
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
      const data = await res.json();
      return data.results ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDiscoverMovies(
  lang: string | null,
  sort: DiscoverSort,
  genre: number | null
) {
  return useQuery({
    queryKey: ["movies", "discover", lang, sort, genre],
    queryFn: async (): Promise<TMDBMovie[]> => {
      const params = new URLSearchParams()
      if (lang) params.set("lang", lang)
      if (sort !== "trending") params.set("sort", sort)
      if (genre) params.set("genre", String(genre))
      const res = await fetch(`/api/tmdb/discover?${params}`);
      if (!res.ok) throw new Error("Failed to fetch discover movies");
      const data = await res.json();
      return data.results ?? [];
    },
    enabled: lang !== null,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
