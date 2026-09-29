import type { ExpenseCategory } from "@/types/finance";

/**
 * Fixed categorical color assignment. Order matches EXPENSE_CATEGORIES so a
 * category always maps to the same color regardless of filtering or sort
 * order in a given view (identity should never shift with rank).
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Housing: "var(--cat-1)",
  Food: "var(--cat-2)",
  Transport: "var(--cat-3)",
  Shopping: "var(--cat-4)",
  Entertainment: "var(--cat-5)",
  Bills: "var(--cat-6)",
  Subscriptions: "var(--cat-7)",
  Health: "var(--cat-6)",
  Education: "var(--cat-7)",
  Other: "var(--cat-8)",
};

export const SERIES_COLORS = {
  income: "var(--cat-2)",
  expenses: "var(--cat-4)",
  savings: "var(--cat-1)",
  emergencyFund: "var(--cat-5)",
  current: "var(--muted-foreground)",
  scenario: "var(--cat-1)",
};

/** Colour for any category, including user-created ones (stable per name). */
export function categoryColor(category: string): string {
  const fixed = (CATEGORY_COLORS as Record<string, string>)[category];
  if (fixed) return fixed;
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) | 0;
  return `var(--cat-${(Math.abs(h) % 8) + 1})`;
}
