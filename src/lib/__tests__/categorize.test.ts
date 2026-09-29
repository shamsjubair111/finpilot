import { describe, expect, it } from "vitest";
import { buildCategoryModel, categoryKeys, suggestCategory } from "@/lib/categorize";
import type { Transaction } from "@/types/finance";

const tx = (title: string, merchant: string, category: string, type: Transaction["type"] = "expense"): Transaction =>
  ({ id: Math.random().toString(), title, merchant, category, date: "2026-09-01", amount: 1, type, paymentMethod: "cash" }) as Transaction;

describe("categorize", () => {
  it("normalises keys and drops long numbers", () => {
    expect(categoryKeys("bKash Send Money 01712345678", "")).toEqual(["t:bkash send", "t:bkash"]);
    expect(categoryKeys("Lunch", "Star Kabab!")).toEqual(["m:star kabab", "t:lunch"]);
  });

  it("learns the user's habits for a merchant", () => {
    const model = buildCategoryModel([tx("Weekly shop", "Unimart", "Food"), tx("Snacks", "Unimart", "Food"), tx("Gift", "Unimart", "Shopping")]);
    expect(suggestCategory(model, "Anything", "Unimart", "expense")).toBe("Food");
  });

  it("needs repeated, consistent history before trusting it", () => {
    const once = buildCategoryModel([tx("x", "Kiosk", "Entertainment")]);
    expect(suggestCategory(once, "x", "Kiosk", "expense")).toBeNull();
    const split = buildCategoryModel([tx("x", "Corner", "Food"), tx("y", "Corner", "Shopping"), tx("z", "Corner", "Food"), tx("w", "Corner", "Shopping")]);
    expect(suggestCategory(split, "q", "Corner", "expense")).toBeNull();
  });

  it("falls back to keyword rules and keeps income separate", () => {
    expect(suggestCategory(new Map(), "DESCO prepaid", "", "expense")).toBe("Bills");
    const model = buildCategoryModel([tx("Acme", "Acme Ltd", "Salary", "income"), tx("Acme", "Acme Ltd", "Salary", "income")]);
    expect(suggestCategory(model, "Acme", "Acme Ltd", "expense")).toBeNull();
    expect(suggestCategory(model, "Acme", "Acme Ltd", "income")).toBe("Salary");
  });
});

describe("phone-number merchants", () => {
  it("learns a recurring bKash recipient", () => {
    const model = buildCategoryModel([tx("bKash Send Money", "01711111111", "Housing"), tx("bKash Send Money", "01711111111", "Housing")]);
    expect(suggestCategory(model, "bKash Send Money", "01711111111", "expense")).toBe("Housing");
    expect(suggestCategory(model, "bKash Send Money", "01899999999", "expense")).toBe("Housing");
  });
});
