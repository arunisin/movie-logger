"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Compass, BookMarked, User, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const BASE_NAV_ITEMS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/watchlist", label: "Watchlist", icon: BookMarked },
  { href: "/profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch("/api/auth/is-admin")
      .then((res) => res.json())
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false))
  }, [])

  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : BASE_NAV_ITEMS

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-5 py-3 text-xs transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-5 transition-transform",
                active && "scale-110"
              )}
              strokeWidth={active ? 2.5 : 1.8}
            />
            <span className={cn("font-medium", active ? "text-primary" : "")}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
