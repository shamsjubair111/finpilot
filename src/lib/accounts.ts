import type { Account, AccountType, Transaction } from "@/types/finance";
import { amountInAccountCurrency, isForeign, toBase, type Rates } from "@/lib/fx";

export const ACCOUNT_TYPE_META: Record<
  AccountType,
  { label: string; icon: string; color: string; group: "Bank & Cash" | "Wallets" | "Credit Cards" | "Loans"; liability?: boolean }
> = {
  bank: { label: "Bank account", icon: "Landmark", color: "#4f46e5", group: "Bank & Cash" },
  savings: { label: "Savings / FDR / DPS", icon: "PiggyBank", color: "#059669", group: "Bank & Cash" },
  cash: { label: "Cash", icon: "Wallet", color: "#16a34a", group: "Bank & Cash" },
  bkash: { label: "bKash", icon: "Smartphone", color: "#e2136e", group: "Wallets" },
  nagad: { label: "Nagad", icon: "Smartphone", color: "#f6921e", group: "Wallets" },
  rocket: { label: "Rocket", icon: "Smartphone", color: "#8c3494", group: "Wallets" },
  upay: { label: "Upay", icon: "Smartphone", color: "#0a66c2", group: "Wallets" },
  e_wallet: { label: "Digital wallet (PayPal, Wise…)", icon: "Globe", color: "#0070ba", group: "Wallets" },
  investment: { label: "Investments / stocks", icon: "LineChart", color: "#0d9488", group: "Bank & Cash" },
  credit_card: { label: "Credit card", icon: "CreditCard", color: "#0f172a", group: "Credit Cards", liability: true },
  loan: { label: "Loan", icon: "HandCoins", color: "#dc2626", group: "Loans", liability: true },
  other: { label: "Other", icon: "CircleDollarSign", color: "#64748b", group: "Bank & Cash" },
};

export const ACCOUNT_GROUPS = ["Bank & Cash", "Wallets", "Credit Cards", "Loans"] as const;

export const isLiability = (type: AccountType) => !!ACCOUNT_TYPE_META[type].liability;

/**
 * Asset accounts: balance = money held. Liability accounts (credit card, loan):
 * balance = amount owed, so spending raises it and payments into it lower it.
 */
/** Currency context for foreign-currency accounts; omit when every account uses the main currency. */
export interface FxContext {
  base: string;
  rates: Rates;
}

/** Each account's balance in its own currency (the main currency unless the account says otherwise). */
export function computeBalances(accounts: Account[], transactions: Transaction[], fx?: FxContext) {
  const currencyOf = new Map(accounts.map((a) => [a.id, a.currency]));
  const flow = new Map<string, number>();
  const add = (id: string | null | undefined, sign: number, t: Transaction) => {
    if (!id) return;
    const v = fx ? amountInAccountCurrency(t, currencyOf.get(id), fx.base, fx.rates) : t.amount;
    flow.set(id, (flow.get(id) ?? 0) + sign * v);
  };
  for (const t of transactions) {
    if (t.type === "income") add(t.accountId, 1, t);
    else if (t.type === "expense") add(t.accountId, -1, t);
    else {
      add(t.accountId, -1, t);
      add(t.toAccountId, 1, t);
    }
  }
  const balances = new Map<string, number>();
  for (const a of accounts) {
    const f = flow.get(a.id) ?? 0;
    balances.set(a.id, isLiability(a.type) ? a.openingBalance - f : a.openingBalance + f);
  }
  return balances;
}

/** Balances converted to the main currency; foreign accounts without a rate count as 0 and are listed. */
export function baseBalances(accounts: Account[], balances: Map<string, number>, fx?: FxContext) {
  const out = new Map<string, number>();
  const missingRates = new Set<string>();
  for (const a of accounts) {
    const b = balances.get(a.id) ?? 0;
    if (!fx || !isForeign(a.currency, fx.base)) out.set(a.id, b);
    else {
      const converted = toBase(b, a.currency!, fx.base, fx.rates);
      if (converted === null) missingRates.add(a.currency!);
      out.set(a.id, converted ?? 0);
    }
  }
  return { balances: out, missingRates: [...missingRates] };
}

export function netWorthOf(accounts: Account[], balances: Map<string, number>, fx?: FxContext) {
  const inBase = baseBalances(accounts, balances, fx).balances;
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (a.archived) continue;
    const b = inBase.get(a.id) ?? 0;
    if (isLiability(a.type)) liabilities += b;
    else assets += b;
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}

export function maskNumber(n?: string | null) {
  if (!n) return "";
  return n.length > 4 ? `•••• ${n.slice(-4)}` : n;
}

/**
 * Net worth at the end of each of the last `months` months (oldest first), found by replaying
 * each account's opening balance plus every transaction dated up to that month's end.
 */
export function netWorthHistory(accounts: Account[], transactions: Transaction[], months = 12, now = new Date(), fx?: FxContext) {
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const points: { monthEnd: Date; assets: number; liabilities: number; netWorth: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthEnd = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const upTo = sorted.filter((t) => new Date(t.date) <= monthEnd);
    points.push({ monthEnd, ...netWorthOf(accounts, computeBalances(accounts, upTo, fx), fx) });
  }
  return points;
}
