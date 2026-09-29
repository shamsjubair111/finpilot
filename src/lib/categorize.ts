import type { Transaction } from "@/types/finance";
import { guessCategory } from "@/lib/csv-import";

type Kind = "income" | "expense";

/** Normalised lookup keys for a transaction: its merchant, and the first words of its title. */
export function categoryKeys(title: string, merchant = "") {
  const clean = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
  const keys: string[] = [];
  // Merchants keep their digits: a bKash number you always pay rent to is a strong signal.
  const m = clean(merchant);
  if (m) keys.push(`m:${m}`);
  // Titles drop long numbers (phone numbers, references) so "Send Money 017…" groups together.
  const words = clean(title.replace(/[0-9]{4,}/g, " ")).split(" ").filter(Boolean);
  if (words.length) keys.push(`t:${words.slice(0, 2).join(" ")}`);
  if (words.length > 1) keys.push(`t:${words[0]}`);
  return keys;
}

export type CategoryModel = Map<string, Map<string, number>>;

/** Counts which category the user picked for each merchant/title key, separately for income and expenses. */
export function buildCategoryModel(transactions: Transaction[]): CategoryModel {
  const model: CategoryModel = new Map();
  for (const t of transactions) {
    if (t.type === "transfer" || !t.category) continue;
    for (const key of categoryKeys(t.title, t.merchant)) {
      const k = `${t.type}|${key}`;
      const counts = model.get(k) ?? new Map<string, number>();
      counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
      model.set(k, counts);
    }
  }
  return model;
}

/**
 * Best category for a new transaction: the user's own habit for this merchant/title when it's
 * consistent (≥ 2 uses, ≥ 60% agreement), otherwise the keyword rules. Returns null when unsure.
 */
export function suggestCategory(model: CategoryModel, title: string, merchant: string, type: Kind): string | null {
  for (const key of categoryKeys(title, merchant)) {
    const counts = model.get(`${type}|${key}`);
    if (!counts) continue;
    const total = [...counts.values()].reduce((s, n) => s + n, 0);
    const [best, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (n >= 2 && n / total >= 0.6) return best;
  }
  const guess = guessCategory(`${merchant} ${title}`, type);
  return guess === "Other" ? null : guess;
}
