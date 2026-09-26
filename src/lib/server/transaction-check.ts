import "server-only";
import { ApiError } from "./api";
import { db } from "./db";

type Row = Record<string, unknown>;

export async function checkTransaction(data: Row, userId: string, existing?: Row) {
  const merged = { ...existing, ...data };
  const ids = [merged.accountId, merged.toAccountId].filter((v): v is string => typeof v === "string");
  if (ids.length) {
    const owned = await db.account.count({ where: { userId, id: { in: ids } } });
    if (owned !== new Set(ids).size) throw new ApiError(400, "Selected account was not found.");
  }
  if (merged.type === "transfer") {
    if (!merged.accountId || !merged.toAccountId) throw new ApiError(400, "A transfer needs both a from and a to account.");
    if (merged.accountId === merged.toAccountId) throw new ApiError(400, "Choose two different accounts for a transfer.");
    data.category = "Transfer";
  } else if ("type" in data) {
    data.toAccountId = null;
  }
}
