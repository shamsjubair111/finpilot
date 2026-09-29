import { z } from "zod";
import { authed, json } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { payCommitment } from "@/lib/server/recurring";
import { roundMoney } from "@/lib/validation";

const schema = z.object({
  amount: z.coerce.number().finite().min(0.01).max(1e12).transform(roundMoney).optional(),
  date: z.coerce.date().optional(),
});

export const POST = authed<{ id: string }>(async ({ userId, req, params }) => {
  const opts = schema.parse(await req.json().catch(() => ({})));
  const { transaction, commitment } = await payCommitment(userId, params.id, opts);
  return json({ transaction: serialize(transaction), commitment: commitment ? serialize(commitment) : null }, 201);
}, { scope: "ledger" });
