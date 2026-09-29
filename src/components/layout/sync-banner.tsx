"use client";

import { useSyncExternalStore } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function SyncBanner() {
  const { pendingSync } = useFinance();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online && !pendingSync) return null;
  return (
    <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm">
      {online ? <RefreshCw className="size-4 animate-spin text-primary" /> : <CloudOff className="size-4 text-muted-foreground" />}
      <span>
        {!online && t("You're offline. New transactions are saved on this device.")}
        {pendingSync > 0 && ` ${t("{n} waiting to sync.", { n: pendingSync })}`}
      </span>
    </div>
  );
}
