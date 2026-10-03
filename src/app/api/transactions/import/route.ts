import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { rateLimit } from "@/lib/server/rate-limit";
import { transactionSchema } from "@/lib/validation";
import { isForeign, roundCents, toBase, type Rates } from "@/lib/fx";

const importSchema = z.object({
  items: z
    .array(
      transactionSchema
        .extend({ type: z.enum(["income", "expense"]), externalId: z.string().trim().max(64).optional().nullable().transform((v) => v || null) })
        .omit({ toAccountId: true })
    )
    .min(1, "is required")
    .max(500, "must be 500 items or fewer"),
});

export const POST = authed(async ({ userId, req }) => {
  await rateLimit("import", 20, 60 * 60 * 1000, userId);
  const { items } = importSchema.parse(await req.json());

  const accountIds = [...new Set(items.map((i) => i.accountId).filter((v): v is string => !!v))];
  const accounts = accountIds.length ? await db.account.findMany({ where: { userId, id: { in: accountIds } }, select: { id: true, currency: true } }) : [];
  if (accounts.length !== accountIds.length) throw new ApiError(400, "Selected account was not found.");

  // Statements and SMS for a foreign-currency account are in that currency: keep it and convert for totals.
  const owner = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true, exchangeRates: true } });
  const rates = (owner.exchangeRates ?? {}) as Rates;
  const currencyOf = new Map(accounts.map((a) => [a.id, a.currency]));
  for (const item of items) {
    const currency = item.accountId ? currencyOf.get(item.accountId) : null;
    if (!isForeign(currency, owner.currency)) continue;
    const converted = toBase(item.amount, currency!, owner.currency, rates);
    if (converted === null) throw new ApiError(400, `Set an exchange rate for ${currency} in Settings before importing into this account.`);
    Object.assign(item, { originalAmount: item.amount, originalCurrency: currency, amount: roundCents(converted) });
  }

  // Skip anything already imported (same transaction ID) or repeated within this batch.
  const ids = items.map((i) => i.externalId).filter((v): v is string => !!v);
  const existing = new Set(
    ids.length
      ? (await db.transaction.findMany({ where: { userId, externalId: { in: ids } }, select: { externalId: true } })).map((r) => r.externalId)
      : []
  );
  const seen = new Set<string>();
  const fresh = items.filter((i) => {
    if (!i.externalId) return true;
    if (existing.has(i.externalId) || seen.has(i.externalId)) return false;
    seen.add(i.externalId);
    return true;
  });

  const created = fresh.length
    ? await db.transaction.createManyAndReturn({ data: fresh.map((i) => ({ ...i, userId })), skipDuplicates: true })
    : [];
  return json({ created: created.map(serialize), skipped: items.length - created.length }, 201);
}, { scope: "ledger" });
