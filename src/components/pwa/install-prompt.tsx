"use client";

import { useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { cn } from "cn";
import { t } from "@/lib/i18n";

// Chrome/Edge/Android fire `beforeinstallprompt` when the app can be installed; keep the event so a
// button can show the install dialog later. Browsers without it (iOS Safari) simply never show the button.
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useInstallPrompt() {
  const available = useSyncExternalStore(subscribe, () => !!deferred, () => false);
  return {
    available,
    install: async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null;
      notify();
    },
  };
}

export function InstallAppButton({ className }: { className?: string }) {
  const { available, install } = useInstallPrompt();
  if (!available) return null;
  return (
    <button
      type="button"
      onClick={install}
      className={cn("flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm font-medium transition-colors hover:bg-muted", className)}
    >
      <Download className="size-4" />
      {t("Install Sanchay on this device")}
    </button>
  );
}
