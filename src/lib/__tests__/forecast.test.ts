import { describe, expect, it } from "vitest";
import { forecastCashflow } from "@/lib/forecast";

const now = new Date(2026, 9, 3, 10);
const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString();

describe("forecastCashflow", () => {
  it("applies bills and income on their days and finds the lowest point", () => {
    const f = forecastCashflow(20000, [
      { title: "Rent", amount: 18000, type: "expense", dueDate: iso(2026, 9, 5), recurring: true, frequency: "monthly" },
      { title: "Salary", amount: 60000, type: "income", dueDate: iso(2026, 9, 25), recurring: true, frequency: "monthly" },
      { title: "Internet", amount: 1200, type: "expense", dueDate: iso(2026, 9, 10), recurring: false },
    ], 30, now);
    expect(f.lowest.balance).toBe(800);
    expect(f.shortfall).toBe(false);
    expect(f.end).toBe(800 + 60000);
  });

  it("repeats weekly items and counts overdue ones today", () => {
    const f = forecastCashflow(1000, [
      { title: "Overdue", amount: 500, type: "expense", dueDate: iso(2026, 8, 20), recurring: false },
      { title: "Bazar", amount: 300, type: "expense", dueDate: iso(2026, 9, 4), recurring: true, frequency: "weekly" },
    ], 14, now);
    expect(f.points[0].balance).toBe(500);
    expect(f.points[0].events.map((e) => e.title)).toEqual(["Overdue"]);
    // Bazar on the 4th, 11th and (within 14 days) the 18th... but the window ends on the 17th.
    expect(f.end).toBe(500 - 300 * 2);
  });

  it("flags a shortfall", () => {
    expect(forecastCashflow(100, [{ title: "EMI", amount: 5000, type: "expense", dueDate: iso(2026, 9, 8), recurring: false }], 30, now).shortfall).toBe(true);
  });
});
