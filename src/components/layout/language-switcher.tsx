"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGS, type Lang } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "cn";

export function LanguageSwitcher({ onChange, className }: { onChange?: (lang: Lang) => void; className?: string }) {
  const { lang, setLang, t } = useI18n();
  const change = onChange ?? setLang;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5 px-2", className)} aria-label={t("Change language")}>
          <Languages className="size-4" />
          <span className="text-xs font-semibold">{LANGS.find((l) => l.value === lang)?.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.value} onSelect={() => l.value !== lang && change(l.value)} className="justify-between">
            {l.label}
            {l.value === lang && <span className="size-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
