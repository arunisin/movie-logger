"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, RefreshCw, Trash2, ShieldCheck, ShieldOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface Invite {
  id: string
  code: string
  created_at: string
  used_at: string | null
  expires_at: string | null
}

interface GenerateResult {
  code: string
  inviteUrl: string
}

interface UserRow {
  id: string
  email: string | undefined
  username: string | null
  is_admin: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  const supabase = createClient()

  // Auth guard — verify admin status server-side
  useEffect(() => {
    fetch("/api/auth/is-admin")
      .then((res) => res.json())
      .then((data) => {
        if (!data.isAdmin) {
          router.replace("/discover")
          return
        }
        setAuthChecked(true)
        setIsSuperAdmin(data.isSuperAdmin === true)
      })
      .catch(() => {
        router.replace("/discover")
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
      }
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (authChecked && isSuperAdmin) loadUsers()
  }, [authChecked, isSuperAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAdmin = async (userId: string) => {
    setTogglingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, { method: "POST" })
      if (res.ok) {
        const { is_admin } = await res.json()
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_admin } : u))
      }
    } finally {
      setTogglingUserId(null)
    }
  }

  const loadInvites = async () => {
    setInvitesLoading(true)
    const { data } = await supabase
      .from("invites")
      .select("id, code, created_at, used_at, expires_at")
      .order("created_at", { ascending: false })
      .limit(20)
    setInvites((data as Invite[]) ?? [])
    setInvitesLoading(false)
  }

  useEffect(() => {
    if (authChecked) {
      loadInvites()
    }
  }, [authChecked]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)
    setResult(null)

    try {
      const res = await fetch("/api/invites/generate", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setGenerateError(data.error ?? "Failed to generate invite.")
      } else {
        setResult(data as GenerateResult)
        loadInvites()
      }
    } catch {
      setGenerateError("Network error. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/invites/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInvites((prev) => prev.filter((inv) => inv.id !== id))
        if (result?.code === invites.find((i) => i.id === id)?.code) setResult(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = async () => {
    if (!result?.inviteUrl) return
    await navigator.clipboard.writeText(result.inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (!authChecked) {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4-safe pb-3">
          <Skeleton className="h-7 w-48 rounded" />
        </header>
        <div className="px-4 py-5 flex flex-col gap-4">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4-safe pb-3">
        <h1 className="text-xl font-bold text-foreground">Admin — Invite Manager</h1>
      </header>

      <div className="px-4 py-5 flex flex-col gap-6">
        {/* Generate section */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Generate Invite</h2>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-xl h-9 gap-2"
            >
              {generating ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <span>+ Generate</span>
              )}
            </Button>
          </div>

          {generateError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {generateError}
            </p>
          )}

          {result && (
            <div className="bg-muted/50 rounded-xl border border-border p-3 flex flex-col gap-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                New Invite
              </p>
              <p className="font-mono text-2xl font-bold text-primary tracking-widest">
                {result.code}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground truncate flex-1 font-mono">
                  {result.inviteUrl}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg gap-1.5 shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-primary" />
                      <span className="text-primary text-xs">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span className="text-xs">Copy link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Invites list */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Invites
            </h2>
            <button
              type="button"
              onClick={loadInvites}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Refresh invites"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>

          {invitesLoading ? (
            <div className="p-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : invites.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              No invites yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {invites.map((invite) => {
                const used = Boolean(invite.used_at)
                const expired = !used && isExpired(invite.expires_at)

                return (
                  <div key={invite.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-foreground tracking-wider">
                          {invite.code}
                        </span>
                        {used ? (
                          <Badge variant="secondary" className="text-xs">Used</Badge>
                        ) : expired ? (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {used
                          ? `Used ${formatDate(invite.used_at)}`
                          : invite.expires_at
                          ? `Expires ${formatDate(invite.expires_at)}`
                          : `Created ${formatDate(invite.created_at)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(invite.id)}
                      disabled={deletingId === invite.id}
                      className="shrink-0 size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                      aria-label="Delete invite"
                    >
                      {deletingId === invite.id ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Manage Admins — super-admin only */}
        {isSuperAdmin && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Manage Admins
              </h2>
              <button
                type="button"
                onClick={loadUsers}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh users"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>

            {usersLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">No users found.</p>
            ) : (
              <div className="divide-y divide-border">
                {users.map((u) => {
                  const isYou = u.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase()
                  return (
                    <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {u.email}
                          </p>
                          {isYou && (
                            <Badge variant="outline" className="text-xs border-primary/40 text-primary shrink-0">
                              You
                            </Badge>
                          )}
                          {u.is_admin && !isYou && (
                            <Badge variant="secondary" className="text-xs shrink-0">Admin</Badge>
                          )}
                        </div>
                        {u.username && (
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        )}
                      </div>
                      {!isYou && (
                        <button
                          onClick={() => handleToggleAdmin(u.id)}
                          disabled={togglingUserId === u.id}
                          className={cn(
                            "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                            u.is_admin
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                        >
                          {togglingUserId === u.id ? (
                            <RefreshCw className="size-3 animate-spin" />
                          ) : u.is_admin ? (
                            <><ShieldOff className="size-3" /> Revoke</>
                          ) : (
                            <><ShieldCheck className="size-3" /> Make Admin</>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
