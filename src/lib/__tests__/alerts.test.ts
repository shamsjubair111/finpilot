import { describe, expect, it } from "vitest";
import { findUnusualExpenses, projectMonthEnd } from "@/lib/alerts";
import type { Transaction } from "@/types/finance";

const now = new Date(2026, 8, 29);
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const tx = (days: number, amount: number, category = "Food"): Transaction =>
  ({ id: `${days}-${amount}`, title: "x", merchant: "", category, date: daysAgo(days), amount, type: "expense", paymentMethod: "cash" }) as Transaction;

describe("findUnusualExpenses", () => {
  const history = [20, 25, 30, 40, 50, 60].map((d) => tx(d, 400));
  it("flags a recent expense far above the category's usual", () => {
    const found = findUnusualExpenses([...history, tx(2, 2500), tx(3, 450)], now);
    expect(found.map((f) => f.transaction.amount)).toEqual([2500]);
    expect(found[0].typical).toBe(400);
  });
  it("needs enough history and ignores small amounts", () => {
    expect(findUnusualExpenses([tx(20, 100), tx(2, 5000)], now)).toHaveLength(0);
    expect(findUnusualExpenses([...[20, 25, 30, 40, 50].map((d) => tx(d, 50)), tx(2, 300)], now)).toHaveLength(0);
  });
});

describe("projectMonthEnd", () => {
  it("projects spending pace after the first days", () => {
    expect(projectMonthEnd(3000, new Date(2026, 8, 10))).toBe(9000);
    expect(projectMonthEnd(3000, new Date(2026, 8, 2))).toBeNull();
  });
});
