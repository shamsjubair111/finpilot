"use client";

import * as React from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/components/providers/finance-provider";
import { detectRecurring } from "@/lib/recurring-detect";
import { formatCurrency } from "@/lib/currency";
import { t } from "@/lib/i18n";

const DISMISSED_KEY = "sanchay.recurring.dismissed";

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function RecurringSuggestions() {
  const { transactions, commitments, addCommitment, readOnly } = useFinance();
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  React.useEffect(() => {
    // Dismissals are a per-device convenience, read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(readDismissed());
  }, []);

  const suggestions = React.useMemo(
    () => detectRecurring(transactions, commitments.map((c) => c.title)).filter((s) => !dismissed.includes(s.key)),
    [transactions, commitments, dismissed]
  );
  if (readOnly || !suggestions.length) return null;

  function dismiss(key: string) {
    const next = [...dismissed, key];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: dismissal lasts for this visit only.
    }
  }

  return (
    <Card className="mb-6 animate-in-up border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" /> {t("Looks like these repeat every month")}
        </CardTitle>
        <CardDescription>{t("Add them as bills to get reminders and see your fixed costs.")}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {suggestions.map((s) => (
          <div key={s.key} className="flex flex-wrap items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {t("Around day {day} · seen {n} months in a row", { day: s.day, n: s.occurrences })}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{formatCurrency(s.amount)}</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() =>
                addCommitment({
                  title: s.title,
                  category: s.category,
                  amount: s.amount,
                  dueDate: s.nextDue.toISOString().slice(0, 10),
                  recurring: true,
                  frequency: "monthly",
                  type: s.type,
                  accountId: s.accountId,
                  icon: s.type === "income" ? "Banknote" : "CalendarClock",
                })
              }
            >
              <Plus className="size-3.5" />
              {t("Add")}
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label={t("Dismiss")} onClick={() => dismiss(s.key)}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
