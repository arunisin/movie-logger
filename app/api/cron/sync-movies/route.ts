import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_BASE = "https://api.themoviedb.org/3";

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
}

interface TMDBResponse {
  results: TMDBMovie[];
}

async function fetchTMDB(endpoint: string, apiKey: string): Promise<TMDBMovie[]> {
  const url = `${TMDB_BASE}${endpoint}?api_key=${apiKey}&language=en-US&page=1`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`TMDB fetch failed for ${endpoint}: ${res.status} ${res.statusText}`);
  }
  const data: TMDBResponse = await res.json();
  return data.results ?? [];
}

export async function GET(req: NextRequest) {
  // --- Auth check ---
  const authHeader = req.headers.get("authorization");
  const cronSecretHeader = req.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;

  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (
    !cronSecret ||
    (bearerToken !== cronSecret && cronSecretHeader !== cronSecret)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Env vars ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tmdbApiKey = process.env.TMDB_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }
  if (!tmdbApiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY environment variable" },
      { status: 500 }
    );
  }

  // --- Supabase service-role client (bypasses RLS) ---
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // --- Fetch from TMDB ---
  const [trending, nowPlaying] = await Promise.all([
    fetchTMDB("/trending/movie/week", tmdbApiKey),
    fetchTMDB("/movie/now_playing", tmdbApiKey),
  ]);

  // Deduplicate by movie id
  const seen = new Set<number>();
  const movies: TMDBMovie[] = [];
  for (const movie of [...trending, ...nowPlaying]) {
    if (!seen.has(movie.id)) {
      seen.add(movie.id);
      movies.push(movie);
    }
  }

  if (movies.length === 0) {
    return NextResponse.json({ synced: 0, timestamp: new Date().toISOString() });
  }

  // --- Reset all existing movies' is_trending flag ---
  const { error: resetError } = await supabase
    .from("movies")
    .update({ is_trending: false })
    .eq("is_trending", true);

  if (resetError) {
    return NextResponse.json(
      { error: `Failed to reset trending flag: ${resetError.message}` },
      { status: 500 }
    );
  }

  // --- Upsert fetched movies with is_trending = true ---
  const rows = movies.map((m) => ({
    id: m.id,
    title: m.title,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    overview: m.overview,
    release_date: m.release_date,
    vote_average: m.vote_average,
    vote_count: m.vote_count,
    genre_ids: m.genre_ids,
    popularity: m.popularity,
    is_trending: true,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await supabase
    .from("movies")
    .upsert(rows, { onConflict: "id" });

  if (upsertError) {
    return NextResponse.json(
      { error: `Failed to upsert movies: ${upsertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    synced: movies.length,
    timestamp: new Date().toISOString(),
  });
}
