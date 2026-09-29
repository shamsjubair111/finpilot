"use client";

import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { BRAND } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useI18n();
  return (
    <div key={lang} className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="text-[17px] font-semibold tracking-tight">{BRAND[lang]}</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/pricing">{t("Pricing")}</Link>
            </Button>
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{t("Sign in")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">{t("Start free")}</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND[lang]}</p>
          <nav className="flex gap-5">
            <Link href="/pricing" className="hover:text-foreground">{t("Pricing")}</Link>
            <Link href="/privacy" className="hover:text-foreground">{t("Privacy")}</Link>
            <Link href="/terms" className="hover:text-foreground">{t("Terms")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
