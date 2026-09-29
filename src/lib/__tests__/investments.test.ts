import { describe, expect, it } from "vitest";
import { dpsValue, valueInvestment } from "@/lib/calculations";

const now = new Date(2026, 8, 29);

describe("valueInvestment", () => {
  it("accrues simple profit on an FDR paid at maturity", () => {
    const v = valueInvestment({ kind: "fdr", principal: 100000, rate: 10, startDate: new Date(2025, 8, 29).toISOString(), maturityDate: new Date(2027, 8, 29).toISOString(), payout: "maturity" }, now);
    expect(Math.round(v.profit)).toBe(10000);
    expect(Math.round(v.maturityValue!)).toBe(120000);
    expect(v.matured).toBe(false);
    expect(v.daysToMaturity).toBe(365);
  });

  it("counts only completed quarters for Sanchayapatra payouts", () => {
    const v = valueInvestment({ kind: "sanchayapatra", principal: 500000, rate: 11.28, startDate: new Date(2026, 0, 15).toISOString(), maturityDate: new Date(2029, 0, 15).toISOString(), payout: "quarterly" }, now);
    // 15 Jan → 29 Sep = 8 full months → 2 quarters paid.
    expect(Math.round(v.profit)).toBe(Math.round(500000 * 0.1128 * 6 / 12));
    expect(v.value).toBe(500000);
  });

  it("stops accruing at maturity", () => {
    const v = valueInvestment({ kind: "fdr", principal: 1000, rate: 12, startDate: new Date(2024, 0, 1).toISOString(), maturityDate: new Date(2025, 0, 1).toISOString(), payout: "maturity" }, now);
    expect(v.matured).toBe(true);
    expect(v.value).toBeCloseTo(v.maturityValue!, 5);
  });

  it("values a DPS from monthly deposits", () => {
    const v = valueInvestment({ kind: "dps", principal: 0, rate: 0, startDate: new Date(2026, 0, 1).toISOString(), maturityDate: new Date(2031, 0, 1).toISOString(), payout: "maturity", monthlyDeposit: 2000 }, now);
    expect(v.invested).toBe(18000);
    expect(v.maturityValue).toBe(120000);
    expect(dpsValue(1000, 12, 12)).toBeGreaterThan(12000);
  });

  it("uses the current value for market holdings", () => {
    expect(valueInvestment({ kind: "stock", principal: 50000, rate: 0, startDate: now.toISOString(), payout: "maturity", currentValue: 62000 }, now)).toMatchObject({ profit: 12000, method: "market" });
  });
});
