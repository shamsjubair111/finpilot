import type { Currency } from "@/types/finance";
import { getLang, localDigits } from "@/lib/i18n";

export const CURRENCIES: { code: Currency; symbol: string; name: string; bnName: string; locale: string }[] = [
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", bnName: "বাংলাদেশি টাকা", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "US Dollar", bnName: "মার্কিন ডলার", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", bnName: "ইউরো", locale: "en-US" },
  { code: "GBP", symbol: "£", name: "British Pound", bnName: "ব্রিটিশ পাউন্ড", locale: "en-US" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", bnName: "ভারতীয় রুপি", locale: "en-IN" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", bnName: "কানাডিয়ান ডলার", locale: "en-US" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", bnName: "অস্ট্রেলিয়ান ডলার", locale: "en-US" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham", bnName: "আমিরাতি দিরহাম", locale: "en-US" },
  { code: "SAR", symbol: "SAR ", name: "Saudi Riyal", bnName: "সৌদি রিয়াল", locale: "en-US" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", bnName: "মালয়েশিয়ান রিংগিত", locale: "en-US" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", bnName: "সিঙ্গাপুর ডলার", locale: "en-US" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", bnName: "জাপানি ইয়েন", locale: "en-US" },
];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [Currency, ...Currency[]];

let currentCurrency: Currency = "BDT";
export const setCurrencyPref = (c: Currency) => {
  currentCurrency = c;
};
export const getCurrency = () => currentCurrency;

const meta = (c: Currency) => CURRENCIES.find((x) => x.code === c) ?? CURRENCIES[0];

interface FormatCurrencyOptions {
  currency?: Currency;
  compact?: boolean;
  showDecimals?: boolean;
  signDisplay?: "auto" | "always" | "never";
}

function compactParts(abs: number, currency: Currency): [number, string] | null {
  const lakhStyle = currency === "BDT" || currency === "INR";
  const bn = getLang() === "bn";
  if (lakhStyle) {
    if (abs >= 1e7) return [abs / 1e7, bn ? " কোটি" : "Cr"];
    if (abs >= 1e5) return [abs / 1e5, bn ? " লাখ" : "L"];
    if (abs >= 1e3) return [abs / 1e3, bn ? " হাজার" : "K"];
    return null;
  }
  if (abs >= 1e9) return [abs / 1e9, bn ? " বিলিয়ন" : "B"];
  if (abs >= 1e6) return [abs / 1e6, bn ? " মিলিয়ন" : "M"];
  if (abs >= 1e3) return [abs / 1e3, bn ? " হাজার" : "K"];
  return null;
}

export function formatCurrency(amount: number, options: FormatCurrencyOptions = {}): string {
  const { currency = currentCurrency, compact = false, showDecimals = false, signDisplay = "auto" } = options;
  const m = meta(currency);
  const lang = getLang();
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const sign = isNegative ? "-" : signDisplay === "always" && amount > 0 ? "+" : "";

  const parts = compact ? compactParts(abs, currency) : null;
  const body = parts
    ? `${parts[0] % 1 === 0 ? parts[0].toFixed(0) : parts[0].toFixed(1)}${parts[1]}`
    : new Intl.NumberFormat(m.locale, {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals || currency !== "BDT" ? 2 : 0,
      }).format(abs);

  return `${sign}${m.symbol}${localDigits(body, lang)}`;
}

export function getCurrencySymbol(currency: Currency = currentCurrency): string {
  return meta(currency).symbol.trim();
}

export function formatNumber(value: number, opts?: Intl.NumberFormatOptions) {
  return localDigits(new Intl.NumberFormat("en-US", opts).format(value), getLang());
}

export function formatCompactNumber(value: number): string {
  return formatNumber(value, { notation: "compact" });
}
