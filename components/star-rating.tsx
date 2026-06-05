"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number | null
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md"
}

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const starSize = size === "sm" ? "size-4" : "size-5"
  const gap = size === "sm" ? "gap-0.5" : "gap-1"

  const displayValue = hovered ?? value

  return (
    <div className={cn("flex items-center", gap)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayValue !== null && star <= displayValue
        const starClass = cn(
          starSize,
          "transition-transform duration-100",
          filled ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40",
          !readonly && "hover:scale-110 cursor-pointer"
        )

        if (readonly) {
          return (
            <span key={star} aria-label={`${star} star${star !== 1 ? "s" : ""}`}>
              <Star className={starClass} />
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <Star className={starClass} />
          </button>
        )
      })}
    </div>
  )
}
