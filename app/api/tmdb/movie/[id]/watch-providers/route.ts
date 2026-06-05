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
    `https://api.themoviedb.org/3/movie/${id}/watch/providers`,
    { headers: { Authorization: `Bearer ${tmdbToken}` }, next: { revalidate: 86400 } }
  )

  if (!res.ok) {
    console.error(`TMDB watch/providers fetch failed: ${res.status}`)
    return NextResponse.json({ error: "Internal server error" }, { status: res.status })
  }

  const data = await res.json()

  // Prefer IN, fall back to US, then GB
  const regions = ["IN", "US", "GB"]
  let providers: { provider_id: number; provider_name: string; logo_path: string }[] = []

  for (const region of regions) {
    const regionData = data.results?.[region]
    if (regionData?.flatrate?.length) {
      providers = regionData.flatrate.slice(0, 5)
      break
    }
  }

  // JustWatch deep-link for the best matched region
  let justWatchLink: string | null = null
  for (const region of regions) {
    if (data.results?.[region]?.link) {
      justWatchLink = data.results[region].link
      break
    }
  }

  return NextResponse.json({ providers, justWatchLink })
}
