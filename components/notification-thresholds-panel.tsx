"use client"

import { useNotificationThresholds } from "@/hooks/use-profile"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Skeleton } from "@/components/ui/skeleton"

const THRESHOLDS = [
  { days: 1, label: "Releasing tomorrow" },
  { days: 2, label: "In 2 days" },
  { days: 3, label: "In 3 days" },
  { days: 7, label: "In a week" },
]

export function NotificationThresholdsPanel() {
  const { thresholds, isLoading, toggle } = useNotificationThresholds()
  const { isSupported, isSubscribed } = usePushNotifications()

  if (isLoading) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 mx-4 my-1 rounded-lg" />
        ))}
      </div>
    )
  }

  const notificationsActive = isSupported && isSubscribed

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-border/40">
        🔔 Notify me when a film releases
      </div>

      {/* Threshold rows */}
      {THRESHOLDS.map(({ days, label }) => {
        const active = thresholds.includes(days)
        return (
          <div
            key={days}
            className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-0"
          >
            <span className="text-sm text-foreground">{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              disabled={!notificationsActive}
              onClick={() => toggle(days)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                active
                  ? "bg-primary"
                  : "bg-secondary border border-border"
              }`}
            >
              <span
                className={`size-4 rounded-full bg-white shadow-sm transform transition-transform ${
                  active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )
      })}

      {/* Push notifications not active note */}
      {!notificationsActive && (
        <p className="text-xs text-muted-foreground px-4 pb-3 -mt-1">
          Enable push notifications in Profile to receive alerts.
        </p>
      )}
    </div>
  )
}
