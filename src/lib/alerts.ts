import type { Transaction } from "@/types/finance";

const DAY = 24 * 60 * 60 * 1000;

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Recent expenses that are far larger than usual for their category: at least `factor`× the median
 * of that category's previous 90 days, with enough history to judge and a floor to ignore small change.
 */
export function findUnusualExpenses(transactions: Transaction[], now = new Date(), opts = { recentDays: 14, factor: 3, minSamples: 5, minAmount: 500 }) {
  const recentFrom = now.getTime() - opts.recentDays * DAY;
  const historyFrom = recentFrom - 90 * DAY;
  const history = new Map<string, number[]>();
  for (const t of transactions) {
    const time = new Date(t.date).getTime();
    if (t.type === "expense" && time >= historyFrom && time < recentFrom) history.set(t.category, [...(history.get(t.category) ?? []), t.amount]);
  }
  return transactions
    .filter((t) => {
      const time = new Date(t.date).getTime();
      if (t.type !== "expense" || time < recentFrom || time > now.getTime() || t.amount < opts.minAmount) return false;
      const past = history.get(t.category);
      return !!past && past.length >= opts.minSamples && t.amount >= median(past) * opts.factor;
    })
    .map((t) => ({ transaction: t, typical: median(history.get(t.category)!) }))
    .sort((a, b) => b.transaction.amount - a.transaction.amount);
}

/** Month-end spending if the current daily pace continues. Only meaningful after the first few days. */
export function projectMonthEnd(spent: number, now = new Date()) {
  const day = now.getDate();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return day < 5 ? null : (spent / day) * days;
}
