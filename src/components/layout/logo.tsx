"use client";

import { cn } from "cn";
import { LogoMark } from "@/components/brand/logo-mark";
import { useI18n } from "@/lib/i18n/provider";

export const BRAND = { en: "Sanchay", bn: "সঞ্চয়" } as const;

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  const { lang } = useI18n();
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-8 shrink-0 drop-shadow-[0_4px_12px_rgba(139,92,246,0.45)]" />
      {!collapsed && (
        <span className="text-[17px] font-semibold tracking-tight text-sidebar-foreground">{BRAND[lang]}</span>
      )}
    </div>
  );
}
