"use client"

import { cn } from "@/lib/utils"

const GENRES = [
  { label: "All", id: null },
  { label: "Action", id: 28 },
  { label: "Comedy", id: 35 },
  { label: "Drama", id: 18 },
  { label: "Thriller", id: 53 },
  { label: "Sci-Fi", id: 878 },
  { label: "Horror", id: 27 },
  { label: "Romance", id: 10749 },
  { label: "Animation", id: 16 },
] as const

const SORT_OPTIONS = [
  { label: "Trending", value: "trending" },
  { label: "Top Rated", value: "rating" },
  { label: "Newest", value: "newest" },
  { label: "Popular", value: "popular" },
] as const

const LANGUAGES = [
  { code: null,  label: "Global",     flag: "🌐" },
  { code: "hi",  label: "Hindi",      flag: "🇮🇳" },
  { code: "ta",  label: "Tamil",      flag: "🎭" },
  { code: "ml",  label: "Malayalam",  flag: "🌴" },
] as const

export type DiscoverSort = "trending" | "rating" | "newest" | "popular"
export type DiscoverLang = "hi" | "ta" | "ml" | null

interface DiscoverFiltersProps {
  genre: number | null
  sort: DiscoverSort
  lang: DiscoverLang
  onGenreChange: (genre: number | null) => void
  onSortChange: (sort: DiscoverSort) => void
  onLangChange: (lang: DiscoverLang) => void
}

export function DiscoverFilters({
  genre, sort, lang, onGenreChange, onSortChange, onLangChange
}: DiscoverFiltersProps) {
  return (
    <div className="px-4 pb-3 flex flex-col gap-2">
      {/* Language chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {LANGUAGES.map((l) => {
          const isActive = lang === l.code
          return (
            <button
              key={l.code ?? "global"}
              onClick={() => onLangChange(l.code as DiscoverLang)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium shrink-0 transition-colors flex items-center gap-1",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{l.flag}</span>
              {l.label}
            </button>
          )
        })}
      </div>

      {/* Genre chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {GENRES.map((g) => {
          const isActive = genre === g.id
          return (
            <button
              key={g.id ?? "all"}
              onClick={() => onGenreChange(g.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium shrink-0 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Sort chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {SORT_OPTIONS.map((option) => {
          const isActive = sort === option.value
          return (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value as DiscoverSort)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium shrink-0 transition-colors",
                isActive
                  ? "bg-secondary border border-primary/50 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
