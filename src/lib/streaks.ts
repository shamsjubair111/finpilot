import type { Transaction } from "@/types/finance";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export interface Streaks {
  /** Consecutive days up to today with no expenses recorded. Needs some history to mean anything. */
  noSpendDays: number;
  /** Consecutive completed months (most recent first) where income exceeded expenses. */
  savingMonths: number;
  /** Consecutive completed months where total spending stayed within the monthly budget. */
  underBudgetMonths: number;
  /** Most no-spend days in the current month. */
  noSpendThisMonth: number;
}

export function computeStreaks(transactions: Transaction[], monthlyBudget: number, now = new Date()): Streaks {
  const spendDays = new Set<string>();
  const byMonth = new Map<string, { income: number; expenses: number }>();
  let first: Date | null = null;
  for (const t of transactions) {
    const d = new Date(t.date);
    if (!first || d < first) first = d;
    if (t.type === "transfer") continue;
    const m = byMonth.get(monthKey(d)) ?? { income: 0, expenses: 0 };
    if (t.type === "expense") {
      spendDays.add(dayKey(d));
      m.expenses += t.amount;
    } else m.income += t.amount;
    byMonth.set(monthKey(d), m);
  }
  if (!first) return { noSpendDays: 0, savingMonths: 0, underBudgetMonths: 0, noSpendThisMonth: 0 };

  const start = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  let noSpendDays = 0;
  for (let d = new Date(now.getFullYear(), now.getMonth(), now.getDate()); d >= start && !spendDays.has(dayKey(d)); d.setDate(d.getDate() - 1)) noSpendDays++;

  let noSpendThisMonth = 0;
  for (let day = 1; day <= now.getDate(); day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if (d >= start && !spendDays.has(dayKey(d))) noSpendThisMonth++;
  }

  const countMonths = (ok: (m: { income: number; expenses: number }) => boolean) => {
    let n = 0;
    for (let i = 1; i <= 120; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (d < new Date(start.getFullYear(), start.getMonth(), 1)) break;
      const m = byMonth.get(monthKey(d));
      if (!m || !ok(m)) break;
      n++;
    }
    return n;
  };

  return {
    noSpendDays,
    noSpendThisMonth,
    savingMonths: countMonths((m) => m.income > m.expenses),
    underBudgetMonths: monthlyBudget > 0 ? countMonths((m) => m.expenses > 0 && m.expenses <= monthlyBudget) : 0,
  };
}
