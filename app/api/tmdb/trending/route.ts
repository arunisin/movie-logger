import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 21600

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const tmdbApiKey = process.env.TMDB_API_KEY

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Missing Supabase environment variables" }, { status: 500 })
  }
  if (!tmdbApiKey) {
    return NextResponse.json({ error: "TMDB_API_KEY not configured" }, { status: 500 })
  }

  // --- Read from cache (public anon client) ---
  const readClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  })

  const { data: cached, error: cacheError } = await readClient
    .from("movies")
    .select("*")
    .eq("is_trending", true)
    .order("popularity", { ascending: false })
    .limit(20)

  if (!cacheError && cached && cached.length > 0) {
    const mostRecent = cached.reduce((latest, movie) =>
      new Date(movie.updated_at) > new Date(latest.updated_at) ? movie : latest
    )
    const ageMs = Date.now() - new Date(mostRecent.updated_at).getTime()
    if (ageMs < SIX_HOURS_MS) {
      return NextResponse.json({ results: cached, source: "cache" })
    }
  }

  // --- Cache is stale or empty — fetch from TMDB ---
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${tmdbApiKey}&language=en-US`,
    { next: { revalidate: 0 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch trending movies" }, { status: res.status })
  }

  const data = await res.json()

  // --- Update Supabase in the background (await inline — 200-400ms overhead is acceptable) ---
  if (serviceRoleKey && data.results?.length > 0) {
    const writeClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Reset existing trending flags
    await writeClient
      .from("movies")
      .update({ is_trending: false })
      .eq("is_trending", true)

    // Upsert fresh trending movies
    const now = new Date().toISOString()
    const rows = data.results.map((m: {
      id: number
      title: string
      poster_path: string | null
      backdrop_path: string | null
      overview: string
      release_date: string
      vote_average: number
      vote_count: number
      genre_ids: number[]
      popularity: number
    }) => ({
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
      updated_at: now,
    }))

    await writeClient
      .from("movies")
      .upsert(rows, { onConflict: "id" })
  }

  return NextResponse.json({ results: data.results, source: "tmdb" })
}
