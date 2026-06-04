import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ isAdmin: false, isSuperAdmin: false })

  const isSuperAdmin = user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()

  if (isSuperAdmin) {
    return NextResponse.json({ isAdmin: true, isSuperAdmin: true })
  }

  // Check profile-level admin grant
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  return NextResponse.json({
    isAdmin: profile?.is_admin === true,
    isSuperAdmin: false,
  })
}
