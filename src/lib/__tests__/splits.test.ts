import { describe, expect, it } from "vitest";
import { categoryParts, validateSplits } from "@/lib/splits";

describe("splits", () => {
  it("returns one part for a normal transaction", () => {
    expect(categoryParts({ category: "Food", amount: 500 })).toEqual([{ category: "Food", amount: 500 }]);
  });
  it("returns the split parts when present", () => {
    const parts = [{ category: "Food", amount: 3500 }, { category: "Shopping", amount: 1500 }];
    expect(categoryParts({ category: "Food", amount: 5000, splits: parts })).toBe(parts);
  });
  it("validates totals and picks the largest part as the main category", () => {
    expect(validateSplits([{ category: "Food", amount: 3500 }, { category: "Health", amount: 1500.5 }], 5000.5)).toEqual({ ok: true, mainCategory: "Food" });
    expect(validateSplits([{ category: "Food", amount: 3000 }, { category: "Health", amount: 1500 }], 5000).ok).toBe(false);
    expect(validateSplits([{ category: "Food", amount: 5000 }], 5000).ok).toBe(false);
  });
});
