"use client";

import { Check, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";

/** Shown only to people who joined someone else's household. */
export function HouseholdSwitcher() {
  const { user, ledger, households, switchHousehold } = useFinance();
  if (!households.length) return null;
  const shared = ledger.ownerId !== user.id;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={shared ? "default" : "outline"} size="sm" className="max-w-40 gap-1.5" aria-label={t("Switch household")}>
          {shared ? <Users className="size-4" /> : <Home className="size-4" />}
          <span className="hidden truncate sm:inline">{shared ? ledger.ownerName : t("My finances")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{t("Switch household")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => shared && switchHousehold(null)} className="gap-2">
          <Home className="size-4" />
          <span className="flex-1">{t("My finances")}</span>
          {!shared && <Check className="size-4" />}
        </DropdownMenuItem>
        {households.map((h) => (
          <DropdownMenuItem key={h.ownerId} onSelect={() => ledger.ownerId !== h.ownerId && switchHousehold(h.ownerId)} className="gap-2">
            <Users className="size-4" />
            <span className="flex-1 truncate">{h.ownerName}</span>
            <span className="text-[10px] text-muted-foreground">{h.role === "viewer" ? t("View only") : t("Can edit")}</span>
            {ledger.ownerId === h.ownerId && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HouseholdBanner() {
  const { user, ledger, switchHousehold } = useFinance();
  if (ledger.ownerId === user.id) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm">
      <Users className="size-4 text-primary" />
      <span className="flex-1">
        {ledger.role === "viewer"
          ? t("You're viewing {name}'s finances (view only).", { name: ledger.ownerName })
          : t("You're managing {name}'s finances.", { name: ledger.ownerName })}
      </span>
      <Button size="sm" variant="outline" onClick={() => switchHousehold(null)}>{t("Back to my finances")}</Button>
    </div>
  );
}
