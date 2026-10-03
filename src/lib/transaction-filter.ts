export const PERIODS = ["all", "this_month", "last_month", "last_3_months", "this_year", "last_year"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  all: "All time",
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  this_year: "This year",
  last_year: "Last year",
};

/** [from, to) for a period; null means no date limit. */
export function periodRange(period: Period, now = new Date()): [Date, Date] | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case "this_month":
      return [new Date(y, m, 1), new Date(y, m + 1, 1)];
    case "last_month":
      return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    case "last_3_months":
      return [new Date(y, m - 2, 1), new Date(y, m + 1, 1)];
    case "this_year":
      return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
    case "last_year":
      return [new Date(y - 1, 0, 1), new Date(y, 0, 1)];
    default:
      return null;
  }
}

/**
 * Text search over title, merchant and notes; a number also matches the amount
 * ("650" finds ৳650, "1,200" or "1200" finds ৳1,200).
 */
export function matchesSearch(t: { title: string; merchant: string; notes?: string | null; amount: number }, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if ([t.title, t.merchant, t.notes ?? ""].some((s) => s.toLowerCase().includes(q))) return true;
  const n = Number(q.replace(/[,৳$\s]/g, ""));
  return Number.isFinite(n) && n > 0 && Math.abs(t.amount - n) < 0.005;
}
