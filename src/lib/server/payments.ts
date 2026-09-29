import "server-only";
import { db } from "./db";
import { grantPro } from "./plan-grants";
import { validatePayment } from "./sslcommerz";
import { paymentReceiptEmail, sendEmailQuietly, appUrl } from "./email";
import { formatCurrency } from "@/lib/currency";

export const PERIOD_DAYS = { month: 30, year: 365 } as const;

/**
 * Validates a payment with SSLCommerz and, if it matches what we asked for, credits Pro exactly once.
 * Safe to call from both the browser redirect and the IPN: the pending → paid update is conditional.
 */
export async function confirmPayment(valId: string, tranIdHint?: string) {
  const v = await validatePayment(valId);
  if (!v) return { ok: false as const, reason: "invalid" };
  const payment = await db.payment.findUnique({ where: { tranId: v.tran_id } });
  if (!payment || (tranIdHint && tranIdHint !== v.tran_id)) return { ok: false as const, reason: "unknown" };
  if (payment.status === "paid") return { ok: true as const, payment };
  if (Math.abs(Number(v.amount) - payment.amount) > 0.01 || v.currency !== payment.currency) return { ok: false as const, reason: "mismatch" };

  const credited = await db.$transaction(async (tx) => {
    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: "pending" },
      data: { status: "paid", valId, method: v.card_type?.slice(0, 60) ?? null, paidAt: new Date() },
    });
    if (count !== 1) return null;
    return grantPro(
      {
        userId: payment.userId,
        days: PERIOD_DAYS[payment.period as keyof typeof PERIOD_DAYS] ?? 30,
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.tranId,
        grantedBy: "sslcommerz",
        source: "sslcommerz",
      },
      tx
    );
  });

  if (credited) {
    const user = await db.user.findUnique({ where: { id: payment.userId }, select: { email: true, name: true, language: true } });
    if (user)
      sendEmailQuietly({
        to: user.email,
        ...paymentReceiptEmail(user.language === "bn" ? "bn" : "en", user.name, {
          amount: formatCurrency(payment.amount, { currency: "BDT", showDecimals: true }),
          reference: payment.tranId,
          until: credited.toISOString().slice(0, 10),
          method: v.card_type ?? "",
        }, `${await appUrl()}/billing`),
      });
  }
  return { ok: true as const, payment };
}
