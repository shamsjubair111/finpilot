import type { BudgetCategory, Transaction } from "@/types/finance";

export interface PeriodStatement {
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  count: number;
  byCategory: { category: string; amount: number; share: number }[];
  incomeByCategory: { category: string; amount: number }[];
  topExpenses: Transaction[];
  previous: { income: number; expenses: number };
  budgets: { category: string; budgeted: number; spent: number }[];
}

const inRange = (t: Transaction, from: Date, to: Date) => {
  const d = new Date(t.date);
  return d >= from && d < to;
};

/**
 * Summary of one period [from, to) compared with the period of equal length just before it.
 * Budgets are monthly, so they are scaled by the number of months in the period.
 */
export function buildStatement(transactions: Transaction[], budgets: Pick<BudgetCategory, "category" | "budgeted">[], from: Date, to: Date, months = 1): PeriodStatement {
  const prevFrom = months === 12 ? new Date(from.getFullYear() - 1, from.getMonth(), 1) : new Date(from.getFullYear(), from.getMonth() - months, 1);
  const current = transactions.filter((t) => inRange(t, from, to));
  const previous = transactions.filter((t) => inRange(t, prevFrom, from));

  const sum = (list: Transaction[], type: Transaction["type"]) => list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  const income = sum(current, "income");
  const expenses = sum(current, "expense");

  const group = (type: Transaction["type"]) => {
    const m = new Map<string, number>();
    for (const t of current) if (t.type === type) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const spending = group("expense");

  return {
    income,
    expenses,
    net: income - expenses,
    savingsRate: income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0,
    count: current.filter((t) => t.type !== "transfer").length,
    byCategory: spending.map(([category, amount]) => ({ category, amount, share: expenses ? (amount / expenses) * 100 : 0 })),
    incomeByCategory: group("income").map(([category, amount]) => ({ category, amount })),
    topExpenses: current.filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 10),
    previous: { income: sum(previous, "income"), expenses: sum(previous, "expense") },
    budgets: budgets.map((b) => ({
      category: b.category,
      budgeted: b.budgeted * months,
      spent: spending.find(([c]) => c === b.category)?.[1] ?? 0,
    })),
  };
}
