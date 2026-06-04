"use client"

import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="relative flex items-center w-full h-10">
      <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-full rounded-full bg-secondary pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-0"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 size-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
