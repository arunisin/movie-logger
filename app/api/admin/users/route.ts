import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isSuperAdmin = user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const [{ data: authUsers }, { data: profiles }] = await Promise.all([
    serviceClient.auth.admin.listUsers({ perPage: 200 }),
    serviceClient.from("profiles").select("id, username, is_admin"),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const users = (authUsers?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    username: profileMap[u.id]?.username ?? null,
    is_admin: profileMap[u.id]?.is_admin ?? false,
    created_at: u.created_at,
  }))

  return NextResponse.json({ users })
}
