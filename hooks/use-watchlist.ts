"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { WatchlistEntry, WatchlistStatus, MovieLike } from "@/lib/types";

export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: async (): Promise<WatchlistEntry[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("watchlist")
        .select("*, movie:movies(*)")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return (data as WatchlistEntry[]) ?? [];
    },
  });
}

export function useWatchlistStatus(movieId: number): WatchlistStatus {
  const { data } = useWatchlist();
  const entry = data?.find((e) => e.movie_id === movieId);
  return entry?.status ?? null;
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movie: MovieLike) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: movieError } = await supabase.from("movies").upsert(
        {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          popularity: movie.popularity,
        },
        { onConflict: "id" }
      );
      if (movieError) throw movieError;

      const { data, error } = await supabase
        .from("watchlist")
        .insert({ user_id: user.id, movie_id: movie.id, status: "want_to_watch" })
        .select("*, movie:movies(*)")
        .single();
      if (error) throw error;
      return data as WatchlistEntry;
    },
    onMutate: async (movie: MovieLike) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistEntry[]>(["watchlist"]);
      const optimistic: WatchlistEntry = {
        id: `optimistic-${movie.id}`,
        user_id: "optimistic",
        movie_id: movie.id,
        status: "want_to_watch",
        added_at: new Date().toISOString(),
        watched_at: null,
        movie: {
          ...movie,
          is_trending: false,
          updated_at: new Date().toISOString(),
        },
      };
      queryClient.setQueryData<WatchlistEntry[]>(["watchlist"], (old) =>
        old ? [optimistic, ...old] : [optimistic]
      );
      return { previous };
    },
    onError: (_err, _movie, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["watchlist"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useMarkWatched() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movieId: number) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("watchlist")
        .update({ status: "watched", watched_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("movie_id", movieId)
        .select("*, movie:movies(*)")
        .single();
      if (error) throw error;
      return data as WatchlistEntry;
    },
    onMutate: async (movieId: number) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistEntry[]>(["watchlist"]);
      queryClient.setQueryData<WatchlistEntry[]>(["watchlist"], (old) =>
        old?.map((entry) =>
          entry.movie_id === movieId
            ? { ...entry, status: "watched", watched_at: new Date().toISOString() }
            : entry
        ) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["watchlist"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useMarkNotInterested() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movie: MovieLike) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: movieError } = await supabase.from("movies").upsert(
        {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          popularity: movie.popularity,
        },
        { onConflict: "id" }
      );
      if (movieError) throw movieError;

      const { data, error } = await supabase
        .from("watchlist")
        .upsert(
          { user_id: user.id, movie_id: movie.id, status: "not_interested" },
          { onConflict: "user_id,movie_id" }
        )
        .select("*, movie:movies(*)")
        .single();
      if (error) throw error;
      return data as WatchlistEntry;
    },
    onMutate: async (movie: MovieLike) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistEntry[]>(["watchlist"]);
      queryClient.setQueryData<WatchlistEntry[]>(["watchlist"], (old) => {
        const entry: WatchlistEntry = {
          id: `optimistic-${movie.id}`,
          user_id: "optimistic",
          movie_id: movie.id,
          status: "not_interested",
          added_at: new Date().toISOString(),
          watched_at: null,
          movie: {
            ...movie,
            is_trending: false,
            updated_at: new Date().toISOString(),
          },
        };
        if (!old) return [entry];
        const exists = old.some((e) => e.movie_id === movie.id);
        if (exists) {
          return old.map((e) =>
            e.movie_id === movie.id ? { ...e, status: "not_interested" } : e
          );
        }
        return [entry, ...old];
      });
      return { previous };
    },
    onError: (_err, _movie, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["watchlist"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movieId: number) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movieId);
      if (error) throw error;
    },
    onMutate: async (movieId: number) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistEntry[]>(["watchlist"]);
      queryClient.setQueryData<WatchlistEntry[]>(["watchlist"], (old) =>
        old?.filter((entry) => entry.movie_id !== movieId) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["watchlist"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}
