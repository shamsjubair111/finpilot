"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";
import { PLAN_FEATURES } from "@/lib/plan-features";

export function Pricing() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("Simple, honest pricing")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("Every new account gets {n} days of Pro free. No card needed.", { n: TRIAL_DAYS })}
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {(["free", "pro"] as const).map((id) => {
          const plan = PLANS[id];
          return (
            <Card key={id} className={id === "pro" ? "border-primary/50 shadow-lg" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t(plan.name)}
                  {id === "pro" && <Badge>{t("Most popular")}</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-semibold text-foreground">
                    {plan.priceMonthly === 0 ? t("৳0") : t("৳{m}", { m: plan.priceMonthly })}
                  </span>{" "}
                  {t("/ month")}
                </CardDescription>
                {plan.priceYearly > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("or ৳{y} per year — two months free", { y: plan.priceYearly })}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-2 text-sm">
                  {PLAN_FEATURES[id].map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={id === "pro" ? "default" : "outline"}>
                  <Link href="/register">{id === "pro" ? t("Start {n}-day free trial", { n: TRIAL_DAYS }) : t("Start free")}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
