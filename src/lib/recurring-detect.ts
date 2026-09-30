import type { Transaction } from "@/types/finance";
import { categoryKeys } from "@/lib/categorize";

export interface RecurringSuggestion {
  key: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  /** Typical day of the month it happens. */
  day: number;
  nextDue: Date;
  occurrences: number;
  accountId: string | null;
}

const DAY = 86400000;

/**
 * Finds payments that repeat roughly monthly: the same merchant/title in at least 3 of the last
 * 6 months, ~25–35 days apart, with amounts within 20% of their median. Already-tracked bills are skipped.
 */
export function detectRecurring(transactions: Transaction[], existingTitles: string[], now = new Date()): RecurringSuggestion[] {
  const since = now.getTime() - 190 * DAY;
  const known = new Set(existingTitles.flatMap((t) => categoryKeys(t)));
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.type === "transfer" || new Date(t.date).getTime() < since || t.externalId?.startsWith("rec:")) continue;
    const key = `${t.type}|${categoryKeys(t.title, t.merchant)[0] ?? ""}`;
    if (key.endsWith("|")) continue;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const out: RecurringSuggestion[] = [];
  for (const [key, list] of groups) {
    const sorted = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    // One per calendar month (the largest), so a split payment doesn't break the pattern.
    const byMonth = new Map<string, Transaction>();
    for (const t of sorted) {
      const d = new Date(t.date);
      const m = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth.has(m) || byMonth.get(m)!.amount < t.amount) byMonth.set(m, t);
    }
    const monthly = [...byMonth.values()].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    if (monthly.length < 3) continue;
    const gaps = monthly.slice(1).map((t, i) => (+new Date(t.date) - +new Date(monthly[i].date)) / DAY);
    if (!gaps.every((g) => g >= 24 && g <= 38)) continue;
    const amounts = monthly.map((t) => t.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    if (!amounts.every((a) => Math.abs(a - median) <= median * 0.2)) continue;
    const last = monthly[monthly.length - 1];
    if (now.getTime() - +new Date(last.date) > 45 * DAY) continue; // stopped happening
    if (categoryKeys(last.title, last.merchant).some((k) => known.has(k))) continue;

    const days = monthly.map((t) => new Date(t.date).getDate()).sort((a, b) => a - b);
    const day = days[Math.floor(days.length / 2)];
    let nextDue = new Date(now.getFullYear(), now.getMonth(), day);
    if (nextDue.getTime() < now.getTime() - DAY) nextDue = new Date(now.getFullYear(), now.getMonth() + 1, day);
    out.push({
      key,
      title: last.merchant || last.title,
      category: last.category,
      type: last.type as "income" | "expense",
      amount: median,
      day,
      nextDue,
      occurrences: monthly.length,
      accountId: last.accountId ?? null,
    });
  }
  return out.sort((a, b) => b.amount - a.amount).slice(0, 8);
}
