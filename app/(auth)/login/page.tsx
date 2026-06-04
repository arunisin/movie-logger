"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Tab = "signin" | "signup"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supabase = createClient()

  // Pre-fill invite code from ?invite= query param and switch to sign-up tab
  useEffect(() => {
    const invite = searchParams.get("invite")
    if (invite) {
      setInviteCode(invite.toUpperCase())
      setTab("signup")
    }
  }, [searchParams])

  // Debounced admin check on email change (server-side, no NEXT_PUBLIC leak)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!email) {
      setIsAdmin(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/is-admin")
        const data = await res.json()
        setIsAdmin(Boolean(data.isAdmin))
      } catch {
        setIsAdmin(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [email])

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

    // Non-admin users must provide a valid invite code
    if (!isAdmin) {
      if (!inviteCode.trim()) {
        setError("An invite code is required to sign up.")
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/invites/validate?code=${encodeURIComponent(inviteCode.trim())}`)
        const data = await res.json()
        if (!data.valid) {
          setError(data.reason ?? "Invalid or expired invite code.")
          setLoading(false)
          return
        }
      } catch {
        setError("Could not validate invite code. Please try again.")
        setLoading(false)
        return
      }
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/discover`,
        },
      })
      if (error) {
        setError(error.message)
        return
      }

      // Consume the invite code (fire-and-forget — user is now created)
      if (!isAdmin && inviteCode.trim()) {
        fetch("/api/invites/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode.trim() }),
        }).catch(() => {
          // Non-critical — don't block the success message
        })
      }

      setSuccessMessage("Account created! Check your email to confirm your account.")
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
    <div className="w-full max-w-sm" suppressHydrationWarning>
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

              {/* Invite code — hidden for admin email */}
              {!isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="signup-invite" className="text-sm font-medium text-foreground/80">
                    Invite Code
                  </Label>
                  <Input
                    id="signup-invite"
                    type="text"
                    autoComplete="off"
                    placeholder="XXXXXXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    className="h-10 font-mono tracking-widest"
                    maxLength={8}
                    spellCheck={false}
                  />
                </div>
              )}

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
