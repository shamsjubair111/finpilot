/**
 * Zakat on wealth: 2.5% of zakatable assets minus debts due now, owed only when that net amount
 * is at or above the nisab — the value of 85 g of gold or 595 g of silver.
 * This is an estimate to help users plan; scholars differ on details (e.g. which nisab to use,
 * how to treat long-term debts and investments), so the page asks users to confirm with their own scholar.
 */
export const ZAKAT_RATE = 0.025;
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;

export interface ZakatInput {
  cash: number; // cash, bank, mobile wallets
  savings: number; // savings, FDR, DPS
  investments: number; // shares, funds held for trade or growth
  goldGrams: number;
  silverGrams: number;
  goldPricePerGram: number;
  silverPricePerGram: number;
  businessAssets: number; // stock for sale, business cash
  receivables: number; // money others owe you that you expect back
  debtsDue: number; // bills, card balances and instalments due now
  nisabStandard: "gold" | "silver";
}

export interface ZakatResult {
  totalAssets: number;
  goldValue: number;
  silverValue: number;
  netWealth: number;
  nisab: number;
  eligible: boolean;
  zakatDue: number;
  /** True when the chosen standard needs a metal price that wasn't given. */
  missingPrice: boolean;
}

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function calculateZakat(input: ZakatInput): ZakatResult {
  const goldValue = pos(input.goldGrams) * pos(input.goldPricePerGram);
  const silverValue = pos(input.silverGrams) * pos(input.silverPricePerGram);
  const totalAssets =
    pos(input.cash) + pos(input.savings) + pos(input.investments) + pos(input.businessAssets) + pos(input.receivables) + goldValue + silverValue;
  const netWealth = Math.max(0, totalAssets - pos(input.debtsDue));
  const price = input.nisabStandard === "gold" ? pos(input.goldPricePerGram) : pos(input.silverPricePerGram);
  const grams = input.nisabStandard === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  const nisab = price * grams;
  const missingPrice = price === 0;
  const eligible = !missingPrice && netWealth > 0 && netWealth >= nisab;
  return {
    totalAssets,
    goldValue,
    silverValue,
    netWealth,
    nisab,
    eligible,
    zakatDue: eligible ? Math.round(netWealth * ZAKAT_RATE * 100) / 100 : 0,
    missingPrice,
  };
}
