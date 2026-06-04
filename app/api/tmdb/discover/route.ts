import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SORT_MAP: Record<string, string> = {
  trending: "popularity.desc",
  popular: "popularity.desc",
  rating: "vote_average.desc",
  newest: "release_date.desc",
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN
  if (!tmdbToken) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const sp = request.nextUrl.searchParams
  const lang = sp.get("lang")   // e.g. "ml", "ta", "hi"
  const sort = sp.get("sort") ?? "trending"
  const genre = sp.get("genre")

  const params = new URLSearchParams({
    language: "en-US",
    page: "1",
    sort_by: SORT_MAP[sort] ?? "popularity.desc",
    "vote_count.gte": "20",     // skip no-name releases
    include_adult: "false",
  })

  if (lang) params.set("with_original_language", lang)
  if (genre) params.set("with_genres", genre)

  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?${params}`,
    { headers: { Authorization: `Bearer ${tmdbToken}` }, next: { revalidate: 3600 } }
  )

  if (!res.ok) {
    console.error(`TMDB discover failed: ${res.status}`)
    return NextResponse.json({ error: "Internal server error" }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ results: data.results ?? [], source: "discover" })
}
