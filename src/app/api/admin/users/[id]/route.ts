import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";
import { roundMoney } from "@/lib/validation";

const DAY = 24 * 60 * 60 * 1000;

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

  // Extend from the current end date if Pro is still running, so paying early never loses days.
  const now = Date.now();
  const current = user.plan === "pro" && user.planExpiresAt && user.planExpiresAt.getTime() > now ? user.planExpiresAt.getTime() : now;
  const planExpiresAt = new Date(current + body.days * DAY);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { plan: "pro", planExpiresAt } }),
    db.planGrant.create({
      data: {
        userId: user.id,
        email: user.email,
        plan: "pro",
        days: body.days,
        amount: body.amount,
        currency: body.currency.toUpperCase(),
        reference: body.reference,
        grantedBy: adminEmail,
      },
    }),
  ]);
  return json({ ok: true, planExpiresAt: planExpiresAt.toISOString() });
});
