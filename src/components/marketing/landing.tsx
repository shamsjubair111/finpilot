"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, Landmark, MessageSquareText, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { TRIAL_DAYS } from "@/lib/plans";

export function Landing() {
  const { t } = useI18n();
  const features = [
    { icon: Landmark, title: t("Every account in one place"), desc: t("Banks, bKash, Nagad, PayPal, cards and loans — with live balances.") },
    { icon: MessageSquareText, title: t("Import from SMS"), desc: t("Paste bKash, Nagad or bank messages and Sanchay turns them into transactions.") },
    { icon: TrendingUp, title: t("Budgets that track themselves"), desc: t("Spending is matched to your budgets automatically, every month.") },
    { icon: Target, title: t("Goals you actually reach"), desc: t("See how long each goal takes and what to save every month.") },
    { icon: Sparkles, title: t("Plan before you spend"), desc: t("Goals, wishlist affordability and a what-if Scenario Lab.") },
    { icon: Globe2, title: t("Made for Bangladesh and the world"), desc: t("English or বাংলা, taka or any major currency.") },
  ];
  const steps = [
    t("Create a free account in under a minute."),
    t("Add your bank, bKash and cash accounts."),
    t("Paste your SMS or add transactions — Sanchay does the maths."),
  ];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="orb -left-24 -top-24 size-96 bg-[var(--sidebar-primary)] opacity-30" />
        <div className="orb -right-24 top-10 size-80 bg-[var(--cat-6)] opacity-20 [animation-delay:-6s]" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            {t("{n}-day free Pro trial · no card needed", { n: TRIAL_DAYS })}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            {t("Your money,")}{" "}
            <span className="bg-gradient-to-r from-primary via-[oklch(0.65_0.2_330)] to-[oklch(0.7_0.15_165)] bg-clip-text text-transparent">
              {t("finally in focus.")}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {t("Sanchay brings your bank accounts, bKash, cards and savings goals together — and tells you what you can really afford.")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-1.5">
              <Link href="/register">
                {t("Start free")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">{t("See pricing")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20" aria-label={t("Product preview")}>
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <Image
              src="/landing/dashboard.jpg"
              alt={t("The Sanchay dashboard showing net worth, accounts, spending and savings")}
              width={1440}
              height={900}
              priority
              className="h-auto w-full"
            />
          </div>
          <div className="absolute -bottom-10 right-4 hidden w-44 overflow-hidden rounded-[1.75rem] border-4 border-foreground/80 bg-card shadow-2xl sm:block lg:w-52">
            <Image src="/landing/mobile-bn.jpg" alt={t("Sanchay on a phone, in Bangla")} width={390} height={844} className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="card-hover">
              <CardContent className="space-y-3 pt-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h2 className="font-semibold">{f.title}</h2>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">{t("Get started in three steps")}</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s} className="rounded-2xl border bg-background p-5">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
                <p className="mt-3 text-sm">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/register">{t("Create your free account")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
