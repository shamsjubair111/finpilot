"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/components/providers/finance-provider";
import { api } from "@/lib/api-client";
import { t } from "@/lib/i18n";

export default function InvitePage() {
  return (
    <Suspense>
      <Invite />
    </Suspense>
  );
}

function Invite() {
  const token = useSearchParams().get("token") ?? "";
  const { switchHousehold } = useFinance();
  const [state, setState] = useState<{ status: "idle" | "busy" } | { status: "error"; message: string }>({ status: "idle" });

  async function accept() {
    setState({ status: "busy" });
    try {
      const res = await api<{ ownerId: string }>("/household/accept", { method: "POST", body: { token } });
      await switchHousehold(res.ownerId);
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : t("Something went wrong on our side. Please try again.") });
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardHeader className="items-center text-center">
          <Users className="size-8 text-primary" />
          <CardTitle>{t("Join a household")}</CardTitle>
          <CardDescription>{t("You've been invited to share someone's finances on Sanchay.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
          <Button className="w-full" disabled={!token || state.status === "busy"} onClick={accept}>
            {t("Accept invitation")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
