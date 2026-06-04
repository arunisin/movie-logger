"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, RefreshCw } from "lucide-react"
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

export default function AdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

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
      })
      .catch(() => {
        router.replace("/discover")
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3">
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
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3">
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
                          <Badge
                            variant="outline"
                            className={cn("text-xs border-primary/40 text-primary")}
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {formatDate(invite.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {used
                          ? `Used ${formatDate(invite.used_at)}`
                          : invite.expires_at
                          ? `Expires ${formatDate(invite.expires_at)}`
                          : "No expiry"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
