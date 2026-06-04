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

  // Allow super-admin or any profile-level admin
  const isSuperAdmin = user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
  if (!isSuperAdmin) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parse optional body
  let expiresInDays: number | undefined
  try {
    const body = await req.json()
    if (typeof body?.expiresInDays === "number") {
      if (body.expiresInDays <= 0 || body.expiresInDays > 365) {
        return NextResponse.json(
          { error: "expiresInDays must be between 1 and 365" },
          { status: 400 }
        )
      }
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
    console.error(insertError)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  const origin = new URL(req.url).origin
  return NextResponse.json({
    code,
    inviteUrl: `${origin}/login?invite=${code}`,
  })
}
