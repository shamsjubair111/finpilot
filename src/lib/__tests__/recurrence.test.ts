import { describe, expect, it } from "vitest";
import { dueDatesUntil, nextDueDate, transactionCategoryFor } from "@/lib/recurrence";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe("nextDueDate", () => {
  it("steps weekly, monthly, quarterly and yearly", () => {
    expect(iso(nextDueDate(d("2026-09-30"), "weekly"))).toBe("2026-10-07");
    expect(iso(nextDueDate(d("2026-09-15"), "monthly"))).toBe("2026-10-15");
    expect(iso(nextDueDate(d("2026-11-15"), "quarterly"))).toBe("2027-02-15");
    expect(iso(nextDueDate(d("2026-12-01"), "monthly"))).toBe("2027-01-01");
    expect(iso(nextDueDate(d("2028-02-29"), "yearly", 29))).toBe("2029-02-28");
  });

  it("clamps to short months and returns to the anchor day", () => {
    const feb = nextDueDate(d("2027-01-31"), "monthly", 31);
    expect(iso(feb)).toBe("2027-02-28");
    expect(iso(nextDueDate(feb, "monthly", 31))).toBe("2027-03-31");
  });
});

describe("dueDatesUntil", () => {
  it("lists missed dates and the next one", () => {
    const { dates, next } = dueDatesUntil(d("2026-07-10"), d("2026-09-30"), "monthly", 10);
    expect(dates.map(iso)).toEqual(["2026-07-10", "2026-08-10", "2026-09-10"]);
    expect(iso(next)).toBe("2026-10-10");
  });

  it("returns nothing when not yet due and respects the cap", () => {
    expect(dueDatesUntil(d("2026-10-10"), d("2026-09-30"), "monthly").dates).toHaveLength(0);
    expect(dueDatesUntil(d("2020-01-01"), d("2026-09-30"), "weekly", null, 5).dates).toHaveLength(5);
  });
});

describe("transactionCategoryFor", () => {
  it("maps commitment kinds to transaction categories", () => {
    expect(transactionCategoryFor("Bills", "expense")).toBe("Bills");
    expect(transactionCategoryFor("Loan", "expense")).toBe("Other");
    expect(transactionCategoryFor("Salary", "income")).toBe("Salary");
  });
});
