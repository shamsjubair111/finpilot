import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { ASSISTANT_MONTHLY_LIMIT } from "@/lib/plans";

export const GET = authed(
  async ({ userId }) => {
    const month = new Date().toISOString().slice(0, 7);
    const usage = await db.assistantUsage.findUnique({ where: { userId_month: { userId, month } } });
    return json({ used: usage?.count ?? 0, limit: ASSISTANT_MONTHLY_LIMIT });
  },
  { scope: "ledger" }
);
