import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")
  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB_API_KEY not configured" }, { status: 500 })
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`,
    { next: { revalidate: 300 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: "Search failed" }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
