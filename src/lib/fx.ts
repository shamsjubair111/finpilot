/**
 * Foreign-currency accounts. Every transaction's `amount` stays in the user's main currency, so
 * budgets, reports and totals never need converting. A transaction touching a foreign-currency
 * account also stores the foreign figure (`originalAmount` in `originalCurrency`), which is what
 * that account's own balance uses. Rates are entered by the user: 1 unit of foreign = rate × main.
 */
export type Rates = Record<string, number>;

/** True when the account keeps its balance in a currency other than the main one. */
export const isForeign = (accountCurrency: string | null | undefined, base: string) => !!accountCurrency && accountCurrency !== base;

/** Converts a foreign amount to the main currency, or null when there's no rate for it. */
export function toBase(amount: number, currency: string, base: string, rates: Rates): number | null {
  if (currency === base) return amount;
  const rate = rates[currency];
  return rate && rate > 0 ? amount * rate : null;
}

/** The movement of a transaction in an account's own currency. */
export function amountInAccountCurrency(
  t: { amount: number; originalAmount?: number | null; originalCurrency?: string | null },
  accountCurrency: string | null | undefined,
  base: string,
  rates: Rates
) {
  if (!isForeign(accountCurrency, base)) return t.amount;
  if (t.originalCurrency === accountCurrency && t.originalAmount != null) return t.originalAmount;
  // No foreign figure recorded (e.g. added before the account changed currency): convert back.
  const rate = rates[accountCurrency!];
  return rate && rate > 0 ? t.amount / rate : t.amount;
}

export const roundCents = (n: number) => Math.round(n * 100) / 100;
