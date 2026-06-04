import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN
  if (!tmdbToken) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/videos?language=en-US`,
    { headers: { Authorization: `Bearer ${tmdbToken}` }, next: { revalidate: 86400 } }
  )

  if (!res.ok) {
    console.error(`TMDB videos fetch failed: ${res.status}`)
    return NextResponse.json({ error: "Internal server error" }, { status: res.status })
  }

  const data = await res.json()

  // Return only YouTube trailers, official first
  const trailers: { key: string; name: string; official: boolean }[] = (data.results ?? [])
    .filter((v: { site: string; type: string }) => v.site === "YouTube" && v.type === "Trailer")
    .sort((a: { official: boolean }, b: { official: boolean }) => Number(b.official) - Number(a.official))

  return NextResponse.json({ trailers })
}
