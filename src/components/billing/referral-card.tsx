"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Gift, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { t } from "@/lib/i18n";

interface Referral {
  code: string;
  link: string;
  joined: number;
  rewarded: number;
  days: number;
}

export function ReferralCard() {
  const [data, setData] = React.useState<Referral | null>(null);
  React.useEffect(() => {
    api<Referral>("/referrals").then(setData).catch(() => {});
  }, []);
  if (!data) return null;

  const message = t("I use Sanchay to track my money. Join with my link and we both get a free month of Pro:");

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sanchay", text: message, url: data!.link });
        return;
      } catch {
        // Share sheet closed: fall back to copying.
      }
    }
    await navigator.clipboard.writeText(`${message} ${data!.link}`);
    toast.success(t("Link copied"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="size-4 text-primary" /> {t("Invite friends, get Pro free")}
        </CardTitle>
        <CardDescription>
          {t("When a friend signs up with your link and confirms their email, you both get {n} days of Pro.", { n: data.days })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={data.link} onFocus={(e) => e.target.select()} aria-label={t("Your invite link")} className="font-mono text-xs" />
          <Button variant="outline" size="icon" aria-label={t("Copy")} onClick={() => navigator.clipboard.writeText(data.link).then(() => toast.success(t("Link copied")))}>
            <Copy className="size-4" />
          </Button>
          <Button size="icon" aria-label={t("Share")} onClick={share}>
            <Share2 className="size-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("{joined} joined · {rewarded} rewarded", { joined: data.joined, rewarded: data.rewarded })}
        </p>
      </CardContent>
    </Card>
  );
}
