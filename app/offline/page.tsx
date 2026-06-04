export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="size-20 rounded-full bg-card border border-border flex items-center justify-center text-4xl">
        📡
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-foreground">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          No internet connection. Your watchlist and recently viewed movies are still available.
        </p>
      </div>
      <a
        href="/watchlist"
        className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        View my watchlist
      </a>
    </div>
  )
}
