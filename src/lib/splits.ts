export interface SplitPart {
  category: string;
  amount: number;
}

/**
 * The category parts of a transaction for totals: its splits when it has them, otherwise one part
 * with its own category. Every per-category sum in the app should go through this.
 */
export function categoryParts(t: { category: string; amount: number; splits?: SplitPart[] | null }): SplitPart[] {
  return t.splits && t.splits.length > 1 ? t.splits : [{ category: t.category, amount: t.amount }];
}

/** Checks parts add up to the total (to the cent) and returns the category to show for the whole. */
export function validateSplits(parts: SplitPart[], total: number): { ok: true; mainCategory: string } | { ok: false; error: string } {
  if (parts.length < 2) return { ok: false, error: "A split needs at least two parts." };
  if (parts.some((p) => !(p.amount > 0) || !p.category)) return { ok: false, error: "Each part needs a category and an amount." };
  const sum = Math.round(parts.reduce((s, p) => s + p.amount, 0) * 100);
  if (sum !== Math.round(total * 100)) return { ok: false, error: "The parts must add up to the total amount." };
  return { ok: true, mainCategory: [...parts].sort((a, b) => b.amount - a.amount)[0].category };
}
