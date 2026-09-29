"use client";

import * as React from "react";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api-client";
import { t } from "@/lib/i18n";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export function PushCard() {
  const [state, setState] = React.useState<"loading" | "on" | "off" | "blocked" | "unsupported">("loading");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!supported() || !VAPID_KEY) {
      // Browser capabilities are only known after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") return setState("blocked");
    navigator.serviceWorker.getRegistration().then(async (reg) => setState((await reg?.pushManager.getSubscription()) ? "on" : "off"));
  }, []);

  async function toggle(on: boolean) {
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error(t("Install or reload the app first, then try again."));
      if (on) {
        if ((await Notification.requestPermission()) !== "granted") {
          setState("blocked");
          return;
        }
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_KEY!) });
        await api("/push", { method: "POST", body: sub.toJSON() });
        setState("on");
        toast.success(t("Notifications on"));
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api("/push", { method: "DELETE", body: { endpoint: sub.endpoint } });
          await sub.unsubscribe();
        }
        setState("off");
        toast.success(t("Notifications off"));
      }
    } catch (err) {
      toast.error(t("Couldn't change notifications"), { description: err instanceof Error ? err.message : undefined });
    } finally {
      setPending(false);
    }
  }

  if (state === "unsupported") return null;
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4 text-muted-foreground" /> {t("Notifications on this device")}
        </CardTitle>
        <CardDescription>{t("Get a reminder on this phone or computer when bills are due.")}</CardDescription>
      </CardHeader>
      <CardContent>
        {state === "blocked" ? (
          <p className="text-sm text-muted-foreground">{t("Notifications are blocked for Sanchay in your browser settings. Allow them there, then come back.")}</p>
        ) : (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm">{t("Bill reminders")}</span>
            <Switch checked={state === "on"} disabled={pending || state === "loading"} onCheckedChange={toggle} />
          </label>
        )}
      </CardContent>
    </Card>
  );
}
