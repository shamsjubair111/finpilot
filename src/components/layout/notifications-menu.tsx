"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFinance } from "@/components/providers/finance-provider";
import { generateInsights } from "@/lib/derive";

const ICON = {
  warning: { icon: AlertTriangle, tone: "text-warning" },
  positive: { icon: CheckCircle2, tone: "text-success" },
  neutral: { icon: Info, tone: "text-primary" },
};

export function NotificationsMenu() {
  const { user, transactions, budgetCategories, goals, purchases } = useFinance();
  const items = React.useMemo(
    () =>
      generateInsights({ user, transactions, budgets: budgetCategories, goals, purchases })
        .sort((a, b) => (a.severity === "warning" ? -1 : 0) - (b.severity === "warning" ? -1 : 0))
        .slice(0, 6),
    [user, transactions, budgetCategories, goals, purchases]
  );
  const warnings = items.filter((i) => i.severity === "warning").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications${warnings ? ` (${warnings} alerts)` : ""}`}>
          <Bell className="size-4" />
          {warnings > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {warnings}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col gap-1 p-1">
            {items.map((n) => {
              const { icon: Icon, tone } = ICON[n.severity];
              return (
                <div key={n.id} className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/insights" className="justify-center text-xs font-medium text-primary">View all insights</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
