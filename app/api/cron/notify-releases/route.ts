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

export async function GET(req: NextRequest) {
  // --- Auth check ---
  const authHeader = req.headers.get('authorization')
  const cronSecretHeader = req.headers.get('x-cron-secret')
  const cronSecret = process.env.CRON_SECRET

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!cronSecret || (bearerToken !== cronSecret && cronSecretHeader !== cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // --- Env vars ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 })
  }

  // --- Service role client (bypasses RLS) ---
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const today = new Date()
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)

  const todayStr = today.toISOString().split('T')[0]
  const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0]

  // --- Query 1: upcoming releases in want_to_watch lists ---
  const { data: upcomingRows, error: upcomingError } = await supabase
    .from('watchlist')
    .select('user_id, movie_id, movies!inner(title, release_date, poster_path)')
    .eq('status', 'want_to_watch')
    .gte('movies.release_date', todayStr)
    .lte('movies.release_date', sevenDaysStr)

  if (upcomingError) {
    return NextResponse.json({ error: `Upcoming query failed: ${upcomingError.message}` }, { status: 500 })
  }

  // --- Query 2: trending movies in want_to_watch lists ---
  const { data: trendingRows, error: trendingError } = await supabase
    .from('watchlist')
    .select('user_id, movie_id, movies!inner(title, poster_path)')
    .eq('status', 'want_to_watch')
    .eq('movies.is_trending', true)

  if (trendingError) {
    return NextResponse.json({ error: `Trending query failed: ${trendingError.message}` }, { status: 500 })
  }

  // Build notifications list: { user_id, title, body, url }
  interface Notification {
    user_id: string
    title: string
    body: string
    url: string
  }

  const notifications: Notification[] = []

  for (const row of upcomingRows ?? []) {
    // Supabase returns joined table as nested object
    const movie = row.movies as unknown as WatchlistMovieRow
    const releaseDate = movie?.release_date
    notifications.push({
      user_id: row.user_id,
      title: 'Releasing soon',
      body: `${movie?.title ?? 'A movie'} is releasing${releaseDate ? ` on ${releaseDate}` : ' soon'}!`,
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

  // Collect unique user IDs
  const userIds = [...new Set(notifications.map((n) => n.user_id))]

  // Fetch push subscriptions for all relevant users
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (subsError) {
    return NextResponse.json({ error: `Subscriptions query failed: ${subsError.message}` }, { status: 500 })
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
