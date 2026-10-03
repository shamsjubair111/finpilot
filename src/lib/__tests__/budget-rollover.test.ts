import { describe, expect, it } from "vitest";
import { budgetsForMonth } from "@/lib/calculations";

const tx = (date: string, amount: number, category = "Food", type = "expense") => ({ date: new Date(date).toISOString(), amount, category, type });

describe("budgetsForMonth", () => {
  const txns = [tx("2026-08-10", 7000), tx("2026-09-05", 2000), tx("2026-09-06", 500, "Bills"), tx("2026-09-07", 9000, "Food", "income")];
  it("carries last month's unspent amount only for rollover budgets", () => {
    const [food, bills] = budgetsForMonth(
      [{ category: "Food", budgeted: 10000, rollover: true }, { category: "Bills", budgeted: 3000 }],
      txns,
      new Date(2026, 8, 15)
    );
    expect(food).toMatchObject({ baseBudgeted: 10000, carriedOver: 3000, budgeted: 13000, spent: 2000 });
    expect(bills).toMatchObject({ carriedOver: 0, budgeted: 3000, spent: 500 });
  });
  it("never carries a negative amount", () => {
    const [food] = budgetsForMonth([{ category: "Food", budgeted: 5000, rollover: true }], txns, new Date(2026, 8, 15));
    expect(food.carriedOver).toBe(0);
  });
});

describe("budgetsForMonth with splits", () => {
  it("counts each split part towards its own budget", () => {
    const split = { date: new Date("2026-09-08").toISOString(), amount: 5000, category: "Food", type: "expense", splits: [{ category: "Food", amount: 3500 }, { category: "Shopping", amount: 1500 }] };
    const [food, shopping] = budgetsForMonth([{ category: "Food", budgeted: 10000 }, { category: "Shopping", budgeted: 3000 }], [split], new Date(2026, 8, 15));
    expect(food.spent).toBe(3500);
    expect(shopping.spent).toBe(1500);
  });
});
