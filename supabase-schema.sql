-- ============================================================
-- Filmlog — Supabase schema
-- ============================================================

-- ------------------------------------------------------------
-- 1. movies (cache of TMDB data, populated by cron job)
-- ------------------------------------------------------------
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  release_date TEXT,
  vote_average NUMERIC(4,2),
  vote_count INTEGER,
  genre_ids INTEGER[] DEFAULT '{}',
  popularity NUMERIC(10,3),
  is_trending BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movies_is_trending ON movies (is_trending);

-- ------------------------------------------------------------
-- 2. profiles (auto-created on auth.users insert via trigger)
-- ------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. watchlist
-- ------------------------------------------------------------
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id),
  status TEXT NOT NULL CHECK (status IN ('want_to_watch', 'watched')) DEFAULT 'want_to_watch',
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watched_at TIMESTAMPTZ,
  UNIQUE(user_id, movie_id)
);

CREATE INDEX idx_watchlist_user_id ON watchlist (user_id);
CREATE INDEX idx_watchlist_movie_id ON watchlist (movie_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

-- ------------------------------------------------------------
-- movies RLS
-- ------------------------------------------------------------
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can read movies
CREATE POLICY "movies: public read"
  ON movies FOR SELECT
  USING (true);

-- Only service role can insert/update (bypasses RLS entirely,
-- but explicit policies make intent clear for non-service roles)
CREATE POLICY "movies: service role insert"
  ON movies FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "movies: service role update"
  ON movies FOR UPDATE
  USING (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- profiles RLS
-- ------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles: read own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Authenticated users can read public profiles
CREATE POLICY "profiles: read public"
  ON profiles FOR SELECT
  USING (
    is_public = true
    AND auth.role() = 'authenticated'
  );

-- Users can update only their own profile
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- watchlist RLS
-- ------------------------------------------------------------
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Users have full CRUD on their own watchlist rows
CREATE POLICY "watchlist: select own"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "watchlist: insert own"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist: update own"
  ON watchlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist: delete own"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Authenticated users can read watchlist rows of users whose profile is public
CREATE POLICY "watchlist: read public profiles"
  ON watchlist FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = watchlist.user_id
        AND profiles.is_public = true
    )
  );

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_public, created_at, updated_at)
  VALUES (
    NEW.id,
    -- Use email prefix as default username, trimmed to 30 chars
    LEFT(SPLIT_PART(NEW.email, '@', 1), 30),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Push notification subscriptions
-- ============================================================
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ============================================================
-- Invite codes
-- ============================================================
CREATE TABLE invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read an invite to validate it
CREATE POLICY "Read invites for validation"
  ON invites FOR SELECT
  USING (auth.role() = 'authenticated' OR used_by IS NULL);

-- Only service role can insert/update invites
CREATE POLICY "Service role manages invites"
  ON invites FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_invites_code ON invites(code);

-- Allow 'not_interested' status
ALTER TABLE watchlist DROP CONSTRAINT IF EXISTS watchlist_status_check;
ALTER TABLE watchlist ADD CONSTRAINT watchlist_status_check
  CHECK (status IN ('want_to_watch', 'watched', 'not_interested'));

-- Allow authenticated users to upsert TMDB movie data (public data, no RLS needed)
CREATE POLICY "Authenticated users can insert movies"
  ON movies FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update movies"
  ON movies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
