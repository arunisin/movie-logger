import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 21600

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

export async function GET(_req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN

  if (!supabaseUrl || !anonKey) {
    console.error("Missing Supabase environment variables")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  if (!tmdbToken) {
    console.error("TMDB_READ_ACCESS_TOKEN not configured")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
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

  // --- Cache is stale or empty — proxy TMDB (read-only, no DB writes) ---
  const res = await fetch(
    "https://api.themoviedb.org/3/trending/movie/week?language=en-US",
    { headers: { Authorization: `Bearer ${tmdbToken}` }, next: { revalidate: 0 } }
  )

  if (!res.ok) {
    console.error(`TMDB trending fetch failed: ${res.status} ${res.statusText}`)
    return NextResponse.json({ error: "Internal server error" }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ results: data.results, source: "tmdb" })
}
