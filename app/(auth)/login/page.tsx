"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Tab = "signin" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push("/discover")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccessMessage("Account created! Check your email to confirm your account.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (newTab: Tab) => {
    setTab(newTab)
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xl">
        {/* Tab switcher */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => switchTab("signin")}
            className={cn(
              "flex-1 py-3.5 text-sm font-semibold tracking-wide transition-colors",
              tab === "signin"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab("signup")}
            className={cn(
              "flex-1 py-3.5 text-sm font-semibold tracking-wide transition-colors",
              tab === "signup"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6">
          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signin-email" className="text-sm font-medium text-foreground/80">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signin-password" className="text-sm font-medium text-foreground/80">
                  Password
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-xl font-semibold mt-1"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signup-confirm" className="text-sm font-medium text-foreground/80">
                  Confirm Password
                </Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {successMessage && (
                <p className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                  {successMessage}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-xl font-semibold mt-1"
              >
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Track the films you&apos;ve watched. Save the ones you want to see.
      </p>
    </div>
  )
}
