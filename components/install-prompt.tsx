"use client"

import { useState, useEffect } from "react"
import { X, Download, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    if (ios) {
      // iOS has no install event — show manual tip after a delay
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem("pwa-prompt-dismissed", "1")
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl flex gap-3 items-start">
        <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-xl">🎬</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Add Filmlog to Home Screen</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap <Share className="inline size-3 mb-0.5" /> then &ldquo;Add to Home Screen&rdquo; for the full app experience.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Install for offline access and a native app feel.
            </p>
          )}

          {!isIOS && (
            <button
              onClick={handleInstall}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download className="size-3" />
              Install app
            </button>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="shrink-0 size-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
