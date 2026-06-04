import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB_API_KEY not configured" }, { status: 500 })
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=en-US`,
    { next: { revalidate: 3600 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch trending movies" }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
