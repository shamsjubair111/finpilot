"use client";

import * as React from "react";
import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";

interface Event {
  id: string;
  action: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

const LABELS: Record<string, string> = {
  login: "Signed in",
  login_google: "Signed in with Google",
  login_2fa: "Signed in with two-step verification",
  login_failed: "Failed sign-in attempt",
  password_changed: "Password changed",
  password_reset: "Password reset by email",
  sessions_revoked: "Signed out other devices",
  "2fa_enabled": "Two-step verification turned on",
  "2fa_disabled": "Two-step verification turned off",
  data_exported: "Data downloaded",
  google_linked: "Google account linked",
  email_changed: "Sign-in email changed",
};

/** Rough "Chrome on Android" style summary; good enough to recognise your own devices. */
function device(ua: string | null) {
  if (!ua) return null;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl|node|python/i.test(ua) ? "Script" : null;
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : null;
  return [browser, os].filter(Boolean).join(" · ") || null;
}

export function SecurityActivity() {
  const [events, setEvents] = React.useState<Event[] | null>(null);
  React.useEffect(() => {
    api<Event[]>("/auth/activity").then(setEvents).catch(() => setEvents([]));
  }, []);

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" /> {t("Recent security activity")}
        </CardTitle>
        <CardDescription>{t("If something here wasn't you, change your password and sign out other devices.")}</CardDescription>
      </CardHeader>
      <CardContent>
        {events === null ? (
          <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No activity recorded yet.")}</p>
        ) : (
          <ul className="divide-y text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span className={e.action === "login_failed" ? "text-destructive" : ""}>{t(LABELS[e.action] ?? e.action)}</span>
                <span className="text-xs text-muted-foreground">
                  {[device(e.userAgent), e.ip, formatDate(e.createdAt, "d MMM, h:mm a")].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
