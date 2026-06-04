# Filmlog

A self-hostable, invite-only PWA for tracking movies you want to watch and have watched.

![Filmlog](./docs/screenshot.png)

---

## Features

- **Discover** trending and upcoming movies powered by TMDB
- **Watchlist** — mark movies as "Want to Watch" or "Watched"
- **Invite-only signup** — you control who joins your instance
- **Push notifications** — get notified when a tracked movie is releasing within 7 days or becomes trending
- **Public profile** — share your watchlist with a link
- **Admin panel** — generate and manage invite codes from your profile
- **Movie cache** — TMDB data cached in Supabase, refreshed on demand (6-hour TTL)
- **Mobile-first PWA** — installable on any device, works offline for cached content
- **Row-level security** — every Supabase table is locked down by RLS policies

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, Tailwind CSS v4, shadcn/ui (base-rhea / Base UI) |
| State | TanStack Query v5, Zustand v5 |
| Backend | Supabase (Auth, Postgres, RLS) |
| Movie data | TMDB API |
| Push notifications | Web Push API + VAPID |
| Deployment | Vercel (recommended) |

---

## Self-hosting guide

### Prerequisites

- **Node.js 18+** and **pnpm** installed locally
- A [Supabase](https://supabase.com) account (free tier works)
- A [TMDB](https://www.themoviedb.org) account (free)
- A [Vercel](https://vercel.com) account (free Hobby tier works)

---

### 1. Clone & install

```bash
git clone https://github.com/arunisin/movie-logger.git
cd movie-logger
pnpm install
```

---

### 2. Supabase setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Once the project is ready, open **SQL Editor** in the left sidebar.
3. Paste the contents of `supabase-schema.sql` (included in the repo root) and click **Run**.
4. Grab your credentials: **Settings → API**
   - Copy the **Project URL**
   - Copy the **Publishable (anon) key** — safe to expose in the browser
   - Copy the **Secret (service role) key** — keep this server-side only

---

### 3. TMDB setup

1. Create a free account at [themoviedb.org](https://www.themoviedb.org).
2. Go to **Settings → API** and request an API key (choose "Developer").
3. Copy the **API Read Access Token** — this is the long JWT string that starts with `eyJ...`, **not** the short alphanumeric API Key.

---

### 4. VAPID keys (push notifications)

Generate a VAPID key pair locally:

```bash
npx web-push generate-vapid-keys
```

Copy both the public and private keys — you'll need them as environment variables. The public key is set twice (once for the server, once exposed to the browser).

---

### 5. Environment variables

Copy the example file and fill in all values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key — server only, never expose to the browser |
| `TMDB_READ_ACCESS_TOKEN` | TMDB API Read Access Token (the long JWT) |
| `CRON_SECRET` | Any random string — used to protect cron endpoints from unauthorized calls |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL, e.g. `https://filmlog.vercel.app` |
| `VAPID_SUBJECT` | `mailto:your@email.com` — identifies your push notification sender |
| `VAPID_PUBLIC_KEY` | Generated VAPID public key |
| `VAPID_PRIVATE_KEY` | Generated VAPID private key — server only |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same value as `VAPID_PUBLIC_KEY` — exposed to the browser for subscription |
| `ADMIN_EMAIL` | Your email address — this account gets admin access and invite generation |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Same value as `ADMIN_EMAIL` |

---

### 6. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up using your `ADMIN_EMAIL` — the admin account does not need an invite code.

---

### 7. Deploy to Vercel

1. Push your repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Add all environment variables under **Settings → Environment Variables** in the Vercel dashboard. Make sure to add every variable from the table above.
4. Click **Deploy**.

The daily release-notification cron job (`/api/cron/notify-releases`, runs at 9:00 AM UTC) is configured automatically via `vercel.json` — no extra setup needed.

---

### 8. First-time setup after deploy

1. Open your deployed URL and sign up with your `ADMIN_EMAIL`. No invite code is required for the admin account.
2. Navigate to **Profile → Admin** to access the admin panel.
3. Click **Generate Invite** to create an invite link.
4. Share the link with friends — opening it auto-fills the invite code on the signup form.

---

## Inviting friends

Only the admin can generate invites. To invite someone:

1. Go to **Profile → Admin → Generate Invite**.
2. Copy the invite link and send it to them.
3. Invite links do not expire by default. If you want to limit validity, you can set an expiry (in days) before generating.

Recipients open the link, which pre-fills their invite code, then complete signup with their email and a password.

---

## Push notifications

Users can opt in to push notifications from **Profile → Settings → Push notifications** toggle.

Once enabled, notifications are sent when:

- A movie on the user's watchlist has a release date within the next **7 days**
- A movie on the user's watchlist becomes **trending** on TMDB

Notifications are dispatched by the daily cron job (`0 9 * * *` UTC). Users can disable them at any time from the same settings toggle.

---

## Architecture notes

**Movie cache**
TMDB data is cached in Supabase. On the first request, or after the 6-hour TTL expires, a server-side fetch is made to TMDB and the result is upserted into Supabase. Subsequent requests within the TTL window are served directly from the database, avoiding TMDB rate limits and reducing latency.

**Row-level security**
Every table in the database has RLS policies enabled. Users can only read and write their own data. The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is used exclusively in server-side code — cron routes and admin API routes. It is never sent to the browser.

**Auth**
Authentication is handled by Supabase Auth (email + password). The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is used on the client; the service role key is used only in Next.js API routes running on the server.

---

## Contributing

PRs are welcome. Please open an issue first for significant changes.

1. Fork the repo and create a feature branch.
2. Make your changes and ensure `pnpm lint` passes.
3. Open a pull request with a clear description of what changed and why.

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.
