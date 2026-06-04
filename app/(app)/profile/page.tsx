"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useProfile, useUpdateProfile } from "@/hooks/use-profile"
import { useWatchlist } from "@/hooks/use-watchlist"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Globe, Lock, LogOut, Copy, Check, Bell, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { NotificationThresholdsPanel } from "@/components/notification-thresholds-panel"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [copied, setCopied] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: entries, isLoading: watchlistLoading } = useWatchlist()
  const updateProfile = useUpdateProfile()
  const {
    isSupported: notifSupported,
    isSubscribed: notifSubscribed,
    isLoading: notifLoading,
    subscribe: handleNotifSubscribe,
    unsubscribe: handleNotifUnsubscribe,
  } = usePushNotifications()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    fetch("/api/auth/is-admin")
      .then((res) => res.json())
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false))
  }, [])

  const watchedCount = entries?.filter((e) => e.status === "watched").length ?? 0
  const wantToWatchCount = entries?.filter((e) => e.status === "want_to_watch").length ?? 0

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "?"

  const handleTogglePublic = () => {
    if (!profile) return
    updateProfile.mutate({ is_public: !profile.is_public })
  }

  const handleCopyShareLink = async () => {
    if (!user) return
    const link = `${window.location.origin}/u/${user.id}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isLoading = profileLoading || !user

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </header>

      <div className="px-4 py-5 flex flex-col gap-6">
        {/* User info card */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          {isLoading ? (
            <>
              <Skeleton className="size-14 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </>
          ) : (
            <>
              <Avatar size="lg" className="size-14 text-lg">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {profile?.username ?? user?.email}
                </p>
                {profile?.username && (
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member since{" "}
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {watchlistLoading ? (
            <>
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </>
          ) : (
            <>
              <div className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center justify-center gap-1">
                <span className="text-2xl font-bold text-primary">{watchedCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Watched</span>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center justify-center gap-1">
                <span className="text-2xl font-bold text-accent">{wantToWatchCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">To Watch</span>
              </div>
            </>
          )}
        </div>

        {/* Settings section */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Settings
            </h2>
          </div>

          {/* Public profile toggle */}
          <div className="px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                {profile?.is_public ? (
                  <Globe className="size-4 text-primary" />
                ) : (
                  <Lock className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Public profile</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.is_public
                    ? "Anyone with your link can see your watchlist"
                    : "Only you can see your watchlist"}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={profile?.is_public ?? false}
              onClick={handleTogglePublic}
              disabled={updateProfile.isPending || profileLoading}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
                profile?.is_public ? "bg-primary" : "bg-secondary border border-border"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transform transition-transform",
                  profile?.is_public ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Share link (only shown when public) */}
          {profile?.is_public && (
            <div className="px-4 pb-4 border-t border-border/50 pt-3">
              <Button
                variant="outline"
                className="w-full gap-2 rounded-xl h-9"
                onClick={handleCopyShareLink}
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-primary" />
                    <span className="text-primary">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy share link
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Autoplay trailer toggle */}
          <div className="px-4 py-4 flex items-center justify-between gap-3 border-t border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="text-base leading-none">▶</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Autoplay trailer</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.autoplay_trailer ?? true
                    ? "Trailer plays automatically when you open a movie"
                    : "Tap the play button to watch the trailer"}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profile?.autoplay_trailer ?? true}
              onClick={() => updateProfile.mutate({ autoplay_trailer: !(profile?.autoplay_trailer ?? true) })}
              disabled={updateProfile.isPending || profileLoading}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
                (profile?.autoplay_trailer ?? true) ? "bg-primary" : "bg-secondary border border-border"
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transform transition-transform",
                (profile?.autoplay_trailer ?? true) ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* Notification thresholds */}
          {notifSubscribed && (
            <div className="border-t border-border/50">
              <NotificationThresholdsPanel />
            </div>
          )}

          {/* Push notifications toggle */}
          <div className="px-4 py-4 flex items-center justify-between gap-3 border-t border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Bell className={cn("size-4", notifSubscribed ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Push notifications</p>
                <p className="text-xs text-muted-foreground">
                  {!notifSupported
                    ? "Not supported in this browser"
                    : notifSubscribed
                    ? "You'll be notified about upcoming releases"
                    : "Get notified when tracked movies release"}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifSubscribed}
              onClick={notifSubscribed ? handleNotifUnsubscribe : handleNotifSubscribe}
              disabled={!notifSupported || notifLoading}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
                notifSubscribed ? "bg-primary" : "bg-secondary border border-border"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transform transition-transform",
                  notifSubscribed ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        {/* Admin panel link — only for admin */}
        {isAdmin && (
          <Link href="/admin" className="block">
            <Button
              variant="outline"
              className="w-full rounded-xl h-10 gap-2"
            >
              <ShieldCheck className="size-4 text-primary" />
              Admin — Invite Manager
            </Button>
          </Link>
        )}

        {/* Sign out */}
        <Button
          variant="destructive"
          className="w-full rounded-xl h-10 gap-2"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOut className="size-4" />
          {signingOut ? "Signing out…" : "Sign Out"}
        </Button>
      </div>
    </div>
  )
}
