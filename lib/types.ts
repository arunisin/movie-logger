export interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
}

export interface Movie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string | null
  release_date: string | null
  vote_average: number | null
  vote_count: number | null
  genre_ids: number[]
  popularity: number | null
  is_trending: boolean
  updated_at: string
}

export interface Profile {
  id: string
  username: string | null
  is_public: boolean
  is_admin: boolean
  autoplay_trailer: boolean
  notification_thresholds: number[]
  created_at: string
  updated_at: string
}

export interface WatchlistEntry {
  id: string
  user_id: string
  movie_id: number
  status: "want_to_watch" | "watched" | "not_interested"
  added_at: string
  watched_at: string | null
  rating: number | null
  movie: Movie
}

export type WatchlistStatus = "want_to_watch" | "watched" | "not_interested" | null
export type WatchlistFilter = "all" | "want_to_watch" | "watched"
export type MovieLike = TMDBMovie | Movie
