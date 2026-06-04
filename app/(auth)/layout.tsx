import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 pt-safe pb-safe">
      {/* Filmlog brand mark */}
      <div className="mb-8 flex flex-col items-center gap-2 select-none">
        <div className="relative flex items-center justify-center">
          {/* Film strip decorative element */}
          <span className="text-5xl" aria-hidden="true">🎬</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">
          Filmlog
        </h1>
        <p className="text-sm text-muted-foreground tracking-wide uppercase">
          Your personal cinema diary
        </p>
      </div>

      {children}
    </div>
  )
}
