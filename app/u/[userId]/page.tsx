"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { posterUrl, releaseYear } from "@/lib/tmdb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { Profile, WatchlistEntry } from "@/lib/types"
import { ArrowLeft, Eye, BookmarkCheck, Lock } from "lucide-react"

type PublicProfile = Profile & { email?: string }

export default function PublicProfilePage() {
  const router = useRouter()
  const params = useParams<{ userId: string }>()
  const userId = params?.userId

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [entries, setEntries] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    async function fetchData() {
      setLoading(true)

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError || !profileData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(profileData as PublicProfile)

      // Only fetch watchlist if public
      if (profileData.is_public) {
        const { data: watchlistData } = await supabase
          .from("watchlist")
          .select("*, movie:movies(*)")
          .eq("user_id", userId)
          .order("added_at", { ascending: false })

        setEntries((watchlistData as WatchlistEntry[]) ?? [])
      }

      setLoading(false)
    }

    fetchData()
  }, [userId])

  const watched = entries.filter((e) => e.status === "watched")
  const toWatch = entries.filter((e) => e.status === "want_to_watch")

  const displayName = profile?.username ?? `User ${userId?.slice(0, 6)}`
  const avatarLetter = displayName[0]?.toUpperCase() ?? "?"

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full -ml-1"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate">
          {loading ? (
            <Skeleton className="h-5 w-32 rounded" />
          ) : (
            displayName
          )}
        </h1>
      </header>

      {loading ? (
        <div className="px-4 py-6 flex flex-col gap-6">
          {/* Profile skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
      ) : notFound ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-20">
          <span className="text-4xl" aria-hidden="true">🔍</span>
          <p className="text-muted-foreground text-sm text-center">Profile not found.</p>
          <Button variant="outline" className="rounded-xl mt-2" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      ) : !profile?.is_public ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-20">
          <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
            <Lock className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">This profile is private</p>
            <p className="text-sm text-muted-foreground mt-1">
              {displayName} hasn&apos;t made their watchlist public.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl mt-1" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      ) : (
        <div className="px-4 py-5 flex flex-col gap-6">
          {/* Profile info */}
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-14">
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                {watched.length} watched &middot; {toWatch.length} to watch
              </p>
            </div>
          </div>

          {/* Watched movies */}
          {watched.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BookmarkCheck className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Watched ({watched.length})
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {watched.map((entry) => {
                  const poster = posterUrl(entry.movie.poster_path, "w342")
                  const year = releaseYear(entry.movie.release_date)
                  return (
                    <div key={entry.id} className="flex flex-col gap-1">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden relative bg-secondary">
                        {poster ? (
                          <Image
                            src={poster}
                            alt={entry.movie.title}
                            fill
                            sizes="(max-width: 768px) 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Eye className="size-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{entry.movie.title}</p>
                      {year && <p className="text-xs text-muted-foreground/60">{year}</p>}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* To watch */}
          {toWatch.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Wants to Watch ({toWatch.length})
                </h2>
              </div>
              <div className="flex flex-col gap-0">
                {toWatch.map((entry) => {
                  const poster = posterUrl(entry.movie.poster_path, "w342")
                  const year = releaseYear(entry.movie.release_date)
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                    >
                      <div className="w-10 aspect-[2/3] rounded overflow-hidden relative bg-secondary shrink-0">
                        {poster && (
                          <Image
                            src={poster}
                            alt={entry.movie.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.movie.title}</p>
                        {year && <p className="text-xs text-muted-foreground">{year}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {watched.length === 0 && toWatch.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-4xl" aria-hidden="true">🎬</span>
              <p className="text-muted-foreground text-sm">
                {displayName} hasn&apos;t added any movies yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
