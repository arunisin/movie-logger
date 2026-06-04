export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

export function posterUrl(path: string | null, size: "w342" | "w500" | "original" = "w342") {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w780") {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function releaseYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const year = parseInt(dateStr.slice(0, 4))
  return isNaN(year) ? null : year
}
