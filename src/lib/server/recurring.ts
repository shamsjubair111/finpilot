import "server-only";
import type { Commitment } from "@/generated/prisma/client";
import { ApiError } from "./api";
import { db } from "./db";
import { dueDatesUntil, nextDueDate, transactionCategoryFor, type Frequency } from "@/lib/recurrence";

type Row = Record<string, unknown>;

const freq = (c: Pick<Commitment, "frequency">) => c.frequency as Frequency;
const txnType = (c: Pick<Commitment, "type">) => (c.type === "income" ? "income" : c.type === "transfer" ? "transfer" : "expense");

/** Deterministic ID per commitment occurrence, so the same due date can never be posted twice. */
export const occurrenceId = (commitmentId: string, due: Date) => `rec:${commitmentId}:${due.toISOString().slice(0, 10)}`;

function transactionFor(c: Commitment, due: Date, amount = c.amount, date = due) {
  const type = txnType(c);
  return {
    userId: c.userId,
    title: c.title,
    merchant: "",
    category: type === "transfer" ? "Transfer" : transactionCategoryFor(c.category, type),
    date,
    amount,
    type,
    paymentMethod: "other",
    accountId: c.accountId,
    toAccountId: type === "transfer" ? c.toAccountId : null,
    notes: null,
    externalId: occurrenceId(c.id, due),
  };
}

/** crud "check" hook: anchor the schedule to the due date's day and make sure the account is the user's. */
export async function checkCommitment(data: Row, userId: string, existing?: Row) {
  if (data.dueDate instanceof Date) data.anchorDay = data.dueDate.getUTCDate();
  const merged = { ...existing, ...data };
  const ids = [merged.accountId, merged.toAccountId].filter((v): v is string => typeof v === "string");
  if (ids.length && (await db.account.count({ where: { userId, id: { in: ids } } })) !== new Set(ids).size)
    throw new ApiError(400, "Selected account was not found.");
  // A transfer needs two different accounts; other types don't use a destination.
  if (merged.type === "transfer") {
    if (!merged.accountId || !merged.toAccountId) throw new ApiError(400, "A transfer needs both a from and a to account.");
    if (merged.accountId === merged.toAccountId) throw new ApiError(400, "Choose two different accounts for a transfer.");
  } else if ("type" in data || "toAccountId" in data) data.toAccountId = null;
}

/**
 * Posts every overdue occurrence of auto-post commitments and moves them to their next due date.
 * Returns how many commitments were processed (0 almost always), so callers know whether to re-read.
 */
export async function processAutoPost(userId: string, now = new Date()) {
  const due = await db.commitment.findMany({ where: { userId, autoPost: true, recurring: true, dueDate: { lte: now } } });
  let processed = 0;
  for (const c of due) {
    const { dates, next } = dueDatesUntil(c.dueDate, now, freq(c), c.anchorDay);
    if (!dates.length) continue;
    await db.$transaction([
      db.transaction.createMany({ data: dates.map((d) => transactionFor(c, d)), skipDuplicates: true }),
      // Only advance if nobody else advanced it first (two tabs loading at once).
      db.commitment.updateMany({ where: { id: c.id, dueDate: c.dueDate }, data: { dueDate: next } }),
    ]);
    processed++;
  }
  return processed;
}

/** "Mark as paid": records this occurrence, then advances a recurring commitment or removes a one-off. */
export async function payCommitment(userId: string, id: string, opts: { amount?: number; date?: Date }) {
  const c = await db.commitment.findFirst({ where: { id, userId } });
  if (!c) throw new ApiError(404, "Not found. It may have already been deleted.");
  const txnData = transactionFor(c, c.dueDate, opts.amount ?? c.amount, opts.date ?? new Date());
  if (await db.transaction.findFirst({ where: { userId, externalId: txnData.externalId }, select: { id: true } }))
    throw new ApiError(409, "This payment was already recorded.");

  return db.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({ data: txnData });
    const commitment = c.recurring
      ? await tx.commitment.update({ where: { id: c.id }, data: { dueDate: nextDueDate(c.dueDate, freq(c), c.anchorDay) } })
      : (await tx.commitment.delete({ where: { id: c.id } }), null);
    return { transaction, commitment };
  });
}
