"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { Check, Crown, Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";
import { PLANS, RESOURCE_LABELS, type LimitedResource } from "@/lib/plans";
import { PLAN_FEATURES } from "@/lib/plan-features";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function BillingPage() {
  const { user, accounts, goals, budgetCategories, purchases } = useFinance();
  const onPro = user.plan === "pro";
  const endsAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
  const daysLeft = endsAt ? Math.max(0, differenceInCalendarDays(endsAt, new Date())) : null;

  const usage: Record<LimitedResource, number> = {
    accounts: accounts.filter((a) => !a.archived).length,
    goals: goals.length,
    budgets: budgetCategories.length,
    purchases: purchases.length,
  };

  const upgradeHref = SUPPORT_EMAIL
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Sanchay Pro upgrade")}&body=${encodeURIComponent(`Account: ${user.email}`)}`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title={t("Plan & billing")} subtitle={t("Your plan, usage and upgrade options.")} />

      <Card className="animate-in-up">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              {onPro && <Crown className="size-5 text-amber-500" />}
              {t("{plan} plan", { plan: t(PLANS[user.plan].name) })}
            </CardTitle>
            {onPro && daysLeft !== null && (
              <Badge variant="secondary">{t("{n} days left", { n: daysLeft })}</Badge>
            )}
          </div>
          <CardDescription>
            {onPro && endsAt
              ? t("Pro is active until {date}. After that your account moves to Free and keeps all its data.", { date: format(endsAt, "d MMM yyyy") })
              : onPro
                ? t("Pro is active with no end date.")
                : t("You're on the Free plan. Upgrade for unlimited accounts, goals and budgets.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(RESOURCE_LABELS) as LimitedResource[]).map((r) => {
            const limit = PLANS[user.plan].limits[r];
            const unlimited = !Number.isFinite(limit);
            return (
              <div key={r} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{t(RESOURCE_LABELS[r])}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {unlimited ? t("{n} · unlimited", { n: usage[r] }) : `${usage[r]} / ${limit}`}
                  </span>
                </div>
                <Progress value={unlimited ? 0 : Math.min(100, (usage[r] / limit) * 100)} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {(["free", "pro"] as const).map((id) => {
          const plan = PLANS[id];
          const current = user.plan === id;
          return (
            <Card key={id} className={id === "pro" ? "border-primary/40" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t(plan.name)}
                  {current && <Badge>{t("Current")}</Badge>}
                </CardTitle>
                <CardDescription>
                  {plan.priceMonthly === 0
                    ? t("Free forever")
                    : t("৳{m}/month or ৳{y}/year", { m: plan.priceMonthly, y: plan.priceYearly })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {PLAN_FEATURES[id].map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
                {id === "pro" && (!onPro || endsAt) && (
                  upgradeHref ? (
                    <Button asChild className="w-full gap-1.5">
                      <a href={upgradeHref}>
                        <Mail className="size-4" />
                        {onPro ? t("Keep Pro after your trial") : t("Upgrade to Pro")}
                      </a>
                    </Button>
                  ) : (
                    <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
                      {t("Online payment with bKash, Nagad and cards is coming soon.")}
                    </p>
                  )
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
