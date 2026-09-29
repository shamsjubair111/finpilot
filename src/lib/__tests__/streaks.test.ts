import { describe, expect, it } from "vitest";
import { computeStreaks } from "@/lib/streaks";
import type { Transaction } from "@/types/finance";

const now = new Date(2026, 8, 29, 12);
const tx = (y: number, m: number, d: number, amount: number, type: Transaction["type"]): Transaction =>
  ({ id: `${y}${m}${d}${amount}${type}`, title: "", merchant: "", category: "Other", date: new Date(y, m, d, 10).toISOString(), amount, type, paymentMethod: "cash" }) as Transaction;

describe("computeStreaks", () => {
  it("counts no-spend days back from today", () => {
    const s = computeStreaks([tx(2026, 8, 1, 100, "income"), tx(2026, 8, 25, 50, "expense")], 0, now);
    expect(s.noSpendDays).toBe(4); // 26, 27, 28, 29
    expect(s.noSpendThisMonth).toBe(28);
  });

  it("counts saving and under-budget months, stopping at the first miss", () => {
    const txns = [
      tx(2026, 5, 1, 1000, "income"), tx(2026, 5, 2, 1500, "expense"), // June: overspent
      tx(2026, 6, 1, 1000, "income"), tx(2026, 6, 2, 400, "expense"), // July
      tx(2026, 7, 1, 1000, "income"), tx(2026, 7, 2, 600, "expense"), // August
      tx(2026, 8, 1, 50, "expense"),
    ];
    const s = computeStreaks(txns, 500, now);
    expect(s.savingMonths).toBe(2);
    expect(s.underBudgetMonths).toBe(0); // August's 600 is over 500
    expect(computeStreaks(txns, 700, now).underBudgetMonths).toBe(2);
  });

  it("returns zeros without history", () => {
    expect(computeStreaks([], 100, now)).toEqual({ noSpendDays: 0, savingMonths: 0, underBudgetMonths: 0, noSpendThisMonth: 0 });
  });
});
