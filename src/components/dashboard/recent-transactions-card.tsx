"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/currency";
import { CATEGORY_ICON_MAP } from "@/lib/constants";
import type { Transaction } from "@/types/finance";
import { t as tr } from "@/lib/i18n";

export function RecentTransactionsCard({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{tr("Recent Transactions")}</CardTitle>
        <CardAction><Button variant="ghost" size="sm" asChild>
          <Link href="/transactions">{tr("View all")}</Link>
        </Button></CardAction>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={tr("No transactions yet")}
            description={tr("Transactions you add will show up here.")}
          />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => {
              const isIncome = t.type === "income";
              const iconName = CATEGORY_ICON_MAP[t.category] ?? "Receipt";
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      isIncome ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <DynamicIcon name={iconName} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.merchant ? `${t.merchant} · ` : ""}{formatDate(t.date, "MMM d")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {isIncome ? (
                      <ArrowUpRight className="size-3.5 text-success" />
                    ) : (
                      <ArrowDownLeft className="size-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isIncome ? "text-success" : "text-foreground"
                      }`}
                    >
                      {isIncome ? "+" : t.type === "expense" ? "-" : ""}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
