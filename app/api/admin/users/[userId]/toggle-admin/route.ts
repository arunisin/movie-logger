import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only super-admin can grant/revoke admin
  const isSuperAdmin = user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId } = await params

  // Prevent demoting yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot change your own admin status" }, { status: 400 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single()

  const newValue = !(profile?.is_admin ?? false)

  const { error } = await serviceClient
    .from("profiles")
    .update({ is_admin: newValue })
    .eq("id", userId)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, is_admin: newValue })
}
