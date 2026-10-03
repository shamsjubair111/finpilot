"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { useFinance } from "@/components/providers/finance-provider";
import { ACCOUNT_TYPE_META, isLiability } from "@/lib/accounts";
import { formatCurrency } from "@/lib/currency";
import { t } from "@/lib/i18n";

export function AccountsStrip() {
  const { accounts, accountBalances } = useFinance();
  const active = accounts.filter((a) => !a.archived);
  if (!active.length) return null;

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("Your Accounts")}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/accounts">{t("Manage")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {active.map((a) => {
            const meta = ACCOUNT_TYPE_META[a.type];
            const bal = accountBalances.get(a.id) ?? 0;
            return (
              <Link
                key={a.id}
                href={`/transactions?account=${a.id}`}
                className="group flex min-w-44 snap-start items-center gap-3 rounded-2xl border border-border bg-background/60 p-3 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: meta.color }}>
                  <DynamicIcon name={meta.icon} className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-muted-foreground">{a.name}</span>
                  <span className={`block text-sm font-semibold tabular-nums ${isLiability(a.type) ? "text-destructive" : ""}`}>
                    {isLiability(a.type) ? "-" : ""}
                    {formatCurrency(bal, { currency: a.currency ?? undefined })}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
          <Link href="/accounts" className="flex min-w-32 items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary">
            <Plus className="size-4" /> {t("Add")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
