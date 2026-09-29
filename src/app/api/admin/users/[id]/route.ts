import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";
import { roundMoney } from "@/lib/validation";
import { grantPro } from "@/lib/server/plan-grants";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("grant"),
    days: z.coerce.number().int().min(1).max(3660),
    amount: z.coerce.number().finite().min(0).max(1e9).default(0).transform(roundMoney),
    currency: z.string().trim().min(3).max(3).default("BDT"),
    reference: z.string().trim().max(120).optional().transform((v) => v || null),
  }),
  z.object({ action: z.literal("revoke") }),
]);

export const PATCH = adminOnly<{ id: string }>(async ({ req, params, adminEmail }) => {
  const body = schema.parse(await req.json());
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) throw new ApiError(404, "Not found. It may have already been deleted.");

  if (body.action === "revoke") {
    await db.user.update({ where: { id: user.id }, data: { plan: "free", planExpiresAt: null } });
    return json({ ok: true });
  }

  const planExpiresAt = await db.$transaction((tx) =>
    grantPro(
      { userId: user.id, days: body.days, amount: body.amount, currency: body.currency.toUpperCase(), reference: body.reference, grantedBy: adminEmail, source: "manual" },
      tx
    )
  );
  return json({ ok: true, planExpiresAt: planExpiresAt.toISOString() });
});
