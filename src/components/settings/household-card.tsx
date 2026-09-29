"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useFinance } from "@/components/providers/finance-provider";
import { api } from "@/lib/api-client";
import { t } from "@/lib/i18n";

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: "editor" | "viewer";
  accepted: boolean;
}
interface Joined {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  role: string;
}

export function HouseholdCard() {
  const { user, ledger, switchHousehold } = useFinance();
  const [data, setData] = React.useState<{ members: Member[]; joined: Joined[] } | null>(null);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"editor" | "viewer">("editor");
  const [pending, setPending] = React.useState(false);

  const refresh = React.useCallback(() => api<{ members: Member[]; joined: Joined[] }>("/household").then(setData).catch(() => {}), []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function act(fn: () => Promise<unknown>, success: string, failure: string) {
    try {
      await fn();
      toast.success(t(success));
      await refresh();
      return true;
    } catch (err) {
      toast.error(t(failure), { description: err instanceof Error ? err.message : undefined });
      return false;
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    if (await act(() => api("/household/invite", { method: "POST", body: { email, role } }), "Invitation sent", "Couldn't send invitation")) setEmail("");
    setPending(false);
  }

  const inOwnHousehold = ledger.ownerId === user.id;

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" /> {t("Household")}
        </CardTitle>
        <CardDescription>{t("Share your finances with a partner or family member. They sign in with their own account.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {inOwnHousehold && (
          user.plan === "pro" ? (
            <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row">
              <Input type="email" required placeholder={t("Their email address")} value={email} onChange={(e) => setEmail(e.target.value)} className="sm:flex-1" aria-label={t("Their email address")} />
              <Select value={role} onValueChange={(v) => setRole(v as "editor" | "viewer")}>
                <SelectTrigger className="sm:w-36" aria-label={t("Access")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">{t("Can edit")}</SelectItem>
                  <SelectItem value="viewer">{t("View only")}</SelectItem>
                </SelectContent>
              </Select>
              <SubmitButton pending={pending} disabled={!email}>
                <UserPlus className="size-4" />
                {t("Invite")}
              </SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Sharing your household is part of Sanchay Pro.")}{" "}
              <Link href="/billing" className="text-primary hover:underline">{t("Upgrade to Pro")}</Link>
            </p>
          )
        )}

        {!!data?.members.length && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("People in your household")}</p>
            <ul className="divide-y rounded-lg border">
              {data.members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {m.name ?? m.email}
                    {m.name && <span className="ml-1 text-xs text-muted-foreground">{m.email}</span>}
                  </span>
                  {!m.accepted && <Badge variant="secondary">{t("Invited")}</Badge>}
                  <Select value={m.role} onValueChange={(v) => act(() => api(`/household/members/${m.id}`, { method: "PATCH", body: { role: v } }), "Access updated", "Couldn't update access")}>
                    <SelectTrigger className="h-8 w-32" aria-label={t("Access")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">{t("Can edit")}</SelectItem>
                      <SelectItem value="viewer">{t("View only")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("Remove")}
                    onClick={() => act(() => api(`/household/members/${m.id}`, { method: "DELETE" }), "Removed from household", "Couldn't remove")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!data?.joined.length && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("Households you've joined")}</p>
            <ul className="divide-y rounded-lg border">
              {data.joined.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{j.ownerName} <span className="text-xs text-muted-foreground">{j.role === "viewer" ? t("View only") : t("Can edit")}</span></span>
                  {ledger.ownerId !== j.ownerId && (
                    <Button size="sm" variant="outline" onClick={() => switchHousehold(j.ownerId)}>{t("Open")}</Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (await act(() => api(`/household/members/${j.id}`, { method: "DELETE" }), "You left the household", "Couldn't leave") && ledger.ownerId === j.ownerId) switchHousehold(null);
                    }}
                  >
                    {t("Leave")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
