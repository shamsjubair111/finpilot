import { describe, expect, it } from "vitest";
import { buildStatement } from "@/lib/statement";
import type { Transaction } from "@/types/finance";

const tx = (date: Date, amount: number, type: Transaction["type"], category: string): Transaction =>
  ({ id: `${date.toISOString()}${amount}`, title: category, merchant: "", category, date: date.toISOString(), amount, type, paymentMethod: "cash" }) as Transaction;

const txns = [
  tx(new Date(2026, 8, 1), 50000, "income", "Salary"),
  tx(new Date(2026, 8, 3), 15000, "expense", "Housing"),
  tx(new Date(2026, 8, 9), 5000, "expense", "Food"),
  tx(new Date(2026, 8, 10), 1000, "transfer", "Transfer"),
  tx(new Date(2026, 7, 5), 40000, "income", "Salary"),
  tx(new Date(2026, 7, 6), 30000, "expense", "Housing"),
];

describe("buildStatement", () => {
  it("summarises a month against the previous one", () => {
    const s = buildStatement(txns, [{ category: "Food", budgeted: 6000 }], new Date(2026, 8, 1), new Date(2026, 9, 1));
    expect(s).toMatchObject({ income: 50000, expenses: 20000, net: 30000, savingsRate: 60, count: 3 });
    expect(s.byCategory[0]).toMatchObject({ category: "Housing", amount: 15000, share: 75 });
    expect(s.previous).toEqual({ income: 40000, expenses: 30000 });
    expect(s.budgets).toEqual([{ category: "Food", budgeted: 6000, spent: 5000 }]);
    expect(s.topExpenses.map((t) => t.amount)).toEqual([15000, 5000]);
  });

  it("scales budgets for a year and compares with the previous year", () => {
    const s = buildStatement(txns, [{ category: "Food", budgeted: 6000 }], new Date(2026, 0, 1), new Date(2027, 0, 1), 12);
    expect(s.budgets[0].budgeted).toBe(72000);
    expect(s.income).toBe(90000);
    expect(s.previous.income).toBe(0);
  });
});
