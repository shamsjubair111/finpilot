import type { Currency } from "@/types/finance";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const CURRENCY_LOCALES: Record<Currency, string> = {
  BDT: "en-BD",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

interface FormatCurrencyOptions {
  currency?: Currency;
  compact?: boolean;
  showDecimals?: boolean;
  signDisplay?: "auto" | "always" | "never";
}

/**
 * Reusable currency formatter. Defaults to BDT (৳) but can support other
 * currencies later without touching call sites.
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = "BDT",
    compact = false,
    showDecimals = false,
    signDisplay = "auto",
  } = options;

  const symbol = CURRENCY_SYMBOLS[currency];
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (compact && absAmount >= 100000) {
    const value = absAmount / 100000;
    const formatted = `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}L`;
    return `${isNegative ? "-" : signDisplay === "always" ? "+" : ""}${symbol}${formatted}`;
  }

  if (compact && absAmount >= 1000) {
    const value = absAmount / 1000;
    const formatted = `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}K`;
    return `${isNegative ? "-" : signDisplay === "always" ? "+" : ""}${symbol}${formatted}`;
  }

  const numberFormatted = new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  const sign = isNegative ? "-" : signDisplay === "always" ? "+" : "";

  return `${sign}${symbol}${numberFormatted}`;
}

export function getCurrencySymbol(currency: Currency = "BDT"): string {
  return CURRENCY_SYMBOLS[currency];
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}
