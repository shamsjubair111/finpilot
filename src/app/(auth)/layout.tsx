"use client";

import { Globe2, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n/provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useI18n();
  const features = [
    { icon: Wallet, title: t("Every account in one place"), desc: t("Banks, bKash, Nagad, PayPal, cards and loans — with live balances.") },
    { icon: TrendingUp, title: t("Budgets that track themselves"), desc: t("Spending is matched to your budgets automatically, every month.") },
    { icon: Sparkles, title: t("Plan before you spend"), desc: t("Goals, wishlist affordability and a what-if Scenario Lab.") },
    { icon: Globe2, title: t("Made for Bangladesh and the world"), desc: t("English or বাংলা, taka or any major currency.") },
    { icon: ShieldCheck, title: t("Private by design"), desc: t("Your data is tied to your account and protected by secure sessions.") },
  ];

  return (
    <div key={lang} className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="orb -left-24 -top-24 size-96 bg-[var(--sidebar-primary)]" />
        <div className="orb -bottom-32 right-0 size-[28rem] bg-[var(--cat-6)] [animation-delay:-5s]" />
        <div className="orb left-1/3 top-1/2 size-72 bg-[var(--chart-2)] opacity-30 [animation-delay:-9s]" />
        <div className="grid-lines absolute inset-0 opacity-40" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-lg space-y-8">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            {t("Your money,")}{" "}
            <span className="bg-gradient-to-r from-[oklch(0.8_0.14_279)] via-[oklch(0.8_0.15_330)] to-[oklch(0.85_0.13_165)] bg-clip-text text-transparent">
              {t("finally in focus.")}
            </span>
          </h2>
          <ul className="stagger space-y-3">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <f.icon className="size-5 text-[oklch(0.85_0.12_279)]" />
                </div>
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-sidebar-foreground/60">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/40">© {new Date().getFullYear()} {t("Sanchay · সঞ্চয়")}</p>
      </aside>

      <main className="bg-aurora relative flex items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        <div className="orb -right-20 top-10 size-64 bg-primary/40 lg:hidden" />
        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <LanguageSwitcher />
        </div>
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden [&_span]:text-foreground">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
