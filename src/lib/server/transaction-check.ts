import "server-only";
import { ApiError } from "./api";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { validateSplits, type SplitPart } from "@/lib/splits";

type Row = Record<string, unknown>;

export async function checkTransaction(data: Row, userId: string, existing?: Row) {
  const merged = { ...existing, ...data };
  const ids = [merged.accountId, merged.toAccountId].filter((v): v is string => typeof v === "string");
  let currencies: (string | null)[] = [];
  if (ids.length) {
    const owned = await db.account.findMany({ where: { userId, id: { in: ids } }, select: { currency: true } });
    if (owned.length !== new Set(ids).size) throw new ApiError(400, "Selected account was not found.");
    currencies = owned.map((a) => a.currency);
  }
  // A foreign amount only makes sense when one of the accounts uses that currency.
  if ("originalCurrency" in data || "accountId" in data || "toAccountId" in data) {
    const currency = merged.originalCurrency as string | null | undefined;
    if (!currency || !currencies.includes(currency) || merged.originalAmount == null) {
      data.originalAmount = null;
      data.originalCurrency = null;
    }
  }
  // Splits must add up to the total; the transaction shows its largest part's category.
  if ("splits" in data || "amount" in data || "type" in data) {
    const raw = merged.splits;
    const splits = Array.isArray(raw) ? (raw as SplitPart[]) : null;
    // JSON columns are cleared with DbNull, not a plain null.
    if (merged.type === "transfer" || !splits || splits.length < 2) data.splits = Prisma.DbNull;
    else {
      const check = validateSplits(splits, Number(merged.amount));
      if (!check.ok) throw new ApiError(400, check.error);
      data.splits = splits;
      data.category = check.mainCategory;
    }
  }
  if (merged.type === "transfer") {
    if (!merged.accountId || !merged.toAccountId) throw new ApiError(400, "A transfer needs both a from and a to account.");
    if (merged.accountId === merged.toAccountId) throw new ApiError(400, "Choose two different accounts for a transfer.");
    data.category = "Transfer";
  } else if ("type" in data) {
    data.toAccountId = null;
  }
}
