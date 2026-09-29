import { describe, expect, it } from "vitest";
import { calculateZakat, type ZakatInput } from "@/lib/calculations";

const base: ZakatInput = {
  cash: 0, savings: 0, investments: 0, goldGrams: 0, silverGrams: 0, goldPricePerGram: 12000, silverPricePerGram: 150,
  businessAssets: 0, receivables: 0, debtsDue: 0, nisabStandard: "silver",
};

describe("calculateZakat", () => {
  it("is due at 2.5% above the silver nisab", () => {
    const r = calculateZakat({ ...base, cash: 200000 });
    expect(r.nisab).toBe(595 * 150);
    expect(r.eligible).toBe(true);
    expect(r.zakatDue).toBe(5000);
  });

  it("is not due below nisab, and gold nisab is higher", () => {
    expect(calculateZakat({ ...base, cash: 50000 }).eligible).toBe(false);
    const gold = calculateZakat({ ...base, cash: 200000, nisabStandard: "gold" });
    expect(gold.nisab).toBe(85 * 12000);
    expect(gold.eligible).toBe(false);
  });

  it("values metals and subtracts debts due now", () => {
    const r = calculateZakat({ ...base, cash: 100000, goldGrams: 10, debtsDue: 20000 });
    expect(r.goldValue).toBe(120000);
    expect(r.netWealth).toBe(200000);
    expect(r.zakatDue).toBe(5000);
  });

  it("flags a missing nisab price and ignores negative inputs", () => {
    const r = calculateZakat({ ...base, cash: 500000, silverPricePerGram: 0 });
    expect(r.missingPrice).toBe(true);
    expect(r.zakatDue).toBe(0);
    expect(calculateZakat({ ...base, cash: -5 }).totalAssets).toBe(0);
  });
});
