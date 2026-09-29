import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { sslcommerzConfig } from "@/lib/server/sslcommerz";

export const GET = authed(async ({ userId }) => {
  const payments = await db.payment.findMany({ where: { userId, status: "paid" }, orderBy: { createdAt: "desc" }, take: 24 });
  return json({
    online: !!sslcommerzConfig(),
    payments: payments.map((p) => ({ id: p.id, tranId: p.tranId, period: p.period, amount: p.amount, currency: p.currency, method: p.method, paidAt: p.paidAt?.toISOString() ?? null })),
  });
});
