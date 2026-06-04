import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.json({ valid: false, reason: "No code provided" }, { status: 400 })
  }

  // Use anon key — SELECT is permitted via RLS for unused invites
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase
    .from("invites")
    .select("id, expires_at")
    .eq("code", code)
    .is("used_by", null)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ valid: false, reason: "Lookup failed" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ valid: false, reason: "Invalid or already used invite code" })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "Invite code has expired" })
  }

  return NextResponse.json({ valid: true })
}
