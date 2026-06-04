import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  // Require authenticated user
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { code } = body as { code?: string }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 })
  }

  // Use service-role client to update (RLS blocks anon/authenticated writes)
  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await serviceClient
    .from("invites")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("code", code)
    .is("used_by", null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
