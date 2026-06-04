import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

export async function POST(req: NextRequest) {
  // Authenticate the caller
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Admin-only guard
  if (user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parse optional body
  let expiresInDays: number | undefined
  try {
    const body = await req.json()
    if (typeof body?.expiresInDays === "number" && body.expiresInDays > 0) {
      expiresInDays = body.expiresInDays
    }
  } catch {
    // Body is optional — ignore parse errors
  }

  // Generate an 8-character uppercase alphanumeric code
  const code = randomBytes(6).toString("base64url").toUpperCase().slice(0, 8)

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  // Insert using service-role client (bypasses RLS)
  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error: insertError } = await serviceClient.from("invites").insert({
    code,
    created_by: user.id,
    expires_at: expiresAt,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return NextResponse.json({
    code,
    inviteUrl: `${appUrl}/login?invite=${code}`,
  })
}
