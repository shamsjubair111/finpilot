"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export function FullPageLoader({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
  return (
    <div className="bg-aurora relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 -m-6 animate-pulse rounded-full bg-primary/20 blur-2xl" />
        <div className="relative scale-150 [&_span]:text-foreground">
          <Logo />
        </div>
      </div>
      {error ? (
        <div className="relative max-w-sm space-y-4 animate-in-up">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <WifiOff className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="size-4" /> Try again
          </Button>
        </div>
      ) : (
        <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="size-2 animate-bounce rounded-full bg-primary" />
          <span className="ml-2">Loading your finances…</span>
        </div>
      )}
    </div>
  );
}
