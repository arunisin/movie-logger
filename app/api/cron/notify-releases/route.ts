import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification } from '@/lib/push'

interface WatchlistMovieRow {
  user_id: string
  movie_id: number
  title: string
  release_date: string | null
  poster_path: string | null
}

interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

function buildReleaseBody(title: string, days: number): string {
  if (days === 1) return `${title} releases tomorrow!`
  if (days === 7) return `${title} releases in a week`
  return `${title} releases in ${days} days`
}

export async function GET(req: NextRequest) {
  // --- Auth check: only accept Authorization: Bearer <CRON_SECRET> ---
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!cronSecret || bearerToken !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // --- Env vars ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // --- Service role client (bypasses RLS) ---
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const today = new Date()
  const in8Days = new Date(today)
  in8Days.setDate(today.getDate() + 8)

  const todayStr = today.toISOString().split('T')[0]
  const in8DaysStr = in8Days.toISOString().split('T')[0]

  // --- Query 1: want_to_watch entries with movies releasing in next 8 days ---
  const { data: upcomingRows, error: upcomingError } = await supabase
    .from('watchlist')
    .select('user_id, movie_id, movies!inner(title, release_date, poster_path)')
    .eq('status', 'want_to_watch')
    .gte('movies.release_date', todayStr)
    .lte('movies.release_date', in8DaysStr)

  if (upcomingError) {
    console.error(upcomingError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // --- Query 2: trending movies in want_to_watch lists ---
  const { data: trendingRows, error: trendingError } = await supabase
    .from('watchlist')
    .select('user_id, movie_id, movies!inner(title, poster_path)')
    .eq('status', 'want_to_watch')
    .eq('movies.is_trending', true)

  if (trendingError) {
    console.error(trendingError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // --- Collect unique user IDs from upcoming rows to fetch their thresholds ---
  const upcomingUserIds = [...new Set((upcomingRows ?? []).map((r) => r.user_id))]

  // Fetch profiles for users with upcoming releases to get their notification_thresholds
  const profileThresholds = new Map<string, number[]>()
  if (upcomingUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, notification_thresholds')
      .in('id', upcomingUserIds)

    if (profilesError) {
      console.error(profilesError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    for (const profile of profiles ?? []) {
      // Default to [1, 7] if column is missing (e.g. pre-migration rows)
      profileThresholds.set(
        profile.id,
        (profile as { id: string; notification_thresholds: number[] | null }).notification_thresholds ?? [1, 7]
      )
    }
  }

  // Build notifications list: { user_id, title, body, url }
  interface Notification {
    user_id: string
    title: string
    body: string
    url: string
  }

  const notifications: Notification[] = []

  const todayMidnight = new Date(todayStr)

  for (const row of upcomingRows ?? []) {
    const movie = row.movies as unknown as WatchlistMovieRow
    const releaseDate = movie?.release_date
    if (!releaseDate) continue

    // Compute days_until_release as an integer (date diff)
    const releaseMidnight = new Date(releaseDate)
    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntil = Math.round(
      (releaseMidnight.getTime() - todayMidnight.getTime()) / msPerDay
    )

    if (daysUntil < 0) continue

    // Check against this user's thresholds
    const userThresholds = profileThresholds.get(row.user_id) ?? [1, 7]
    if (!userThresholds.includes(daysUntil)) continue

    notifications.push({
      user_id: row.user_id,
      title: 'Releasing soon',
      body: buildReleaseBody(movie?.title ?? 'A movie', daysUntil),
      url: `/movie/${row.movie_id}`,
    })
  }

  for (const row of trendingRows ?? []) {
    const movie = row.movies as unknown as WatchlistMovieRow
    notifications.push({
      user_id: row.user_id,
      title: 'Now trending',
      body: `${movie?.title ?? 'A movie'} from your watchlist is now trending!`,
      url: `/movie/${row.movie_id}`,
    })
  }

  if (notifications.length === 0) {
    return NextResponse.json({ notified: 0, failed: 0 })
  }

  // Collect unique user IDs across all notifications
  const userIds = [...new Set(notifications.map((n) => n.user_id))]

  // Fetch push subscriptions for all relevant users
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (subsError) {
    console.error(subsError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Group subscriptions by user_id
  const subsByUser = new Map<string, (PushSubscriptionRow & { user_id: string })[]>()
  for (const sub of subscriptions ?? []) {
    const list = subsByUser.get(sub.user_id) ?? []
    list.push(sub)
    subsByUser.set(sub.user_id, list)
  }

  let notified = 0
  let failed = 0
  const toDelete: string[] = []

  for (const notification of notifications) {
    const userSubs = subsByUser.get(notification.user_id) ?? []
    for (const sub of userSubs) {
      try {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title: notification.title, body: notification.body, url: notification.url }
        )
        if (result.success) {
          notified++
        } else if (result.gone) {
          toDelete.push(sub.id)
          failed++
        }
      } catch {
        failed++
      }
    }
  }

  // Clean up expired/gone subscriptions
  if (toDelete.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', toDelete)
  }

  return NextResponse.json({ notified, failed })
}
