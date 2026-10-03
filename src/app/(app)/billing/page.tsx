"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";
import { Check, CreditCard, Crown, Mail } from "lucide-react";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { ReferralCard } from "@/components/billing/referral-card";
import { formatCurrency } from "@/lib/currency";
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

interface Coupon {
  code: string;
  percentOff: number;
  month: number;
  year: number;
}

interface PaymentRow {
  id: string;
  tranId: string;
  period: string;
  amount: number;
  currency: string;
  method: string | null;
  paidAt: string | null;
}

export default function BillingPage() {
  const { user, accounts, goals, budgetCategories, purchases, reloadUser } = useFinance();
  const onPro = user.plan === "pro";
  const endsAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
  const daysLeft = endsAt ? Math.max(0, differenceInCalendarDays(endsAt, new Date())) : null;

  const usage: Record<LimitedResource, number> = {
    accounts: accounts.filter((a) => !a.archived).length,
    goals: goals.length,
    budgets: budgetCategories.length,
    purchases: purchases.length,
  };

  const [online, setOnline] = useState(false);
  const [history, setHistory] = useState<PaymentRow[]>([]);
  const [paying, setPaying] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const price = (period: "month" | "year") => (coupon ? coupon[period] : period === "month" ? PLANS.pro.priceMonthly : PLANS.pro.priceYearly);

  useEffect(() => {
    api<{ online: boolean; payments: PaymentRow[] }>("/billing/payments")
      .then((r) => {
        setOnline(r.online);
        setHistory(r.payments);
      })
      .catch(() => {});
    // Returning from the payment page.
    const result = new URLSearchParams(window.location.search).get("payment");
    if (!result) return;
    if (result === "success") {
      toast.success(t("Payment received — thank you!"), { description: t("Pro is active. A receipt is on its way to your email.") });
      reloadUser();
    } else if (result === "cancelled") toast.info(t("Payment cancelled"));
    else toast.error(t("Payment didn't go through"), { description: t("You weren't charged. If money left your account, it will be credited or refunded automatically.") });
    window.history.replaceState(null, "", "/billing");
  }, [reloadUser]);

  async function applyCode(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCoupon(await api<Coupon>("/billing/coupon", { method: "POST", body: { code: codeInput } }));
      toast.success(t("Code applied"));
    } catch (err) {
      setCoupon(null);
      toast.error(t("Couldn't apply code"), { description: err instanceof Error ? err.message : undefined });
    }
  }

  async function checkout(period: "month" | "year") {
    setPaying(period);
    try {
      const res = await api<{ url?: string; granted?: boolean }>("/billing/checkout", { method: "POST", body: { period, coupon: coupon?.code } });
      if (res.granted) {
        toast.success(t("Pro is active — enjoy!"));
        setCoupon(null);
        setCodeInput("");
        setPaying(null);
        await reloadUser();
        return;
      }
      window.location.assign(res.url!);
    } catch (err) {
      toast.error(t("Couldn't start payment"), { description: err instanceof Error ? err.message : undefined });
      setPaying(null);
    }
  }

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
                <Progress value={unlimited ? 0 : Math.min(100, (usage[r] / limit) * 100)} aria-label={t(RESOURCE_LABELS[r])} />
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
                  online || coupon?.month === 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(["month", "year"] as const).map((period) => (
                        <Button key={period} className="gap-1.5" variant={period === "year" ? "default" : "outline"} disabled={!!paying} onClick={() => checkout(period)}>
                          <CreditCard className="size-4" />
                          {price(period) === 0
                            ? period === "month" ? t("Get 1 month free") : t("Get 1 year free")
                            : period === "month" ? t("Pay ৳{n} / month", { n: price("month") }) : t("Pay ৳{n} / year", { n: price("year") })}
                        </Button>
                      ))}
                      <p className="text-center text-xs text-muted-foreground sm:col-span-2">
                        {coupon && t("{code}: {n}% off", { code: coupon.code, n: coupon.percentOff })}{coupon && " · "}
                        {t("bKash, Nagad, Rocket, cards or internet banking via SSLCommerz. Time is added after your current Pro period.")}
                      </p>
                    </div>
                  ) : upgradeHref ? (
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

      <form onSubmit={applyCode} className="flex max-w-sm gap-2">
        <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={t("Have a promo code?")} aria-label={t("Promo code")} maxLength={40} className="uppercase placeholder:normal-case" />
        <Button type="submit" variant="outline" disabled={!codeInput.trim()}>{t("Apply")}</Button>
      </form>

      <ReferralCard />

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Payment history")}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {history.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {p.period === "year" ? t("Pro · 1 year") : t("Pro · 1 month")}
                  <span className="ml-2 text-xs text-muted-foreground">{p.tranId}{p.method ? ` · ${p.method}` : ""}</span>
                </span>
                <span className="tabular-nums">
                  {formatCurrency(p.amount, { currency: "BDT", showDecimals: true })}
                  <span className="ml-2 text-xs text-muted-foreground">{p.paidAt ? format(new Date(p.paidAt), "d MMM yyyy") : ""}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
