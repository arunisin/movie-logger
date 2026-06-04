import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const query = request.nextUrl.searchParams.get("q")
  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN
  if (!tmdbToken) {
    console.error("TMDB_READ_ACCESS_TOKEN not configured")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`,
    { headers: { Authorization: `Bearer ${tmdbToken}` }, next: { revalidate: 300 } }
  )

  if (!res.ok) {
    console.error(`TMDB search failed: ${res.status} ${res.statusText}`)
    return NextResponse.json({ error: "Internal server error" }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
