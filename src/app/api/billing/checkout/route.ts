import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { appUrl } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";
import { createSession, sslcommerzConfig } from "@/lib/server/sslcommerz";
import { PLANS } from "@/lib/plans";
import { discounted, findValidCoupon } from "@/lib/server/coupons";
import { grantPro } from "@/lib/server/plan-grants";
import { PERIOD_DAYS } from "@/lib/server/payments";

const schema = z.object({
  period: z.enum(["month", "year"]),
  phone: z.string().trim().max(20).optional(),
  coupon: z.string().trim().max(40).optional(),
});

// Creates a pending payment and an SSLCommerz session; the browser is sent to the returned URL.
export const POST = authed(async ({ userId, req }) => {
  await rateLimit("checkout", 10, 60 * 60 * 1000, userId);
  const { period, phone, coupon: code } = schema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } });
  const coupon = code ? await findValidCoupon(code) : null;
  const price = period === "year" ? PLANS.pro.priceYearly : PLANS.pro.priceMonthly;
  const amount = coupon ? discounted(price, coupon.percentOff) : price;
  const tranId = `SNC${Date.now().toString(36).toUpperCase()}${randomBytes(4).toString("hex").toUpperCase()}`;

  // A 100%-off code needs no payment: grant Pro straight away.
  if (amount === 0 && coupon) {
    await db.$transaction(async (tx) => {
      const { count } = await tx.coupon.updateMany({
        where: { id: coupon.id, active: true, ...(coupon.maxUses !== null ? { uses: { lt: coupon.maxUses } } : {}) },
        data: { uses: { increment: 1 } },
      });
      if (count !== 1) throw new ApiError(400, "That code has been fully used.");
      await tx.payment.create({ data: { userId, tranId, provider: "coupon", plan: "pro", period, amount: 0, currency: "BDT", status: "paid", coupon: coupon.code, paidAt: new Date() } });
      await grantPro({ userId, days: PERIOD_DAYS[period], amount: 0, currency: "BDT", reference: `coupon:${coupon.code}`, grantedBy: "coupon", source: "coupon" }, tx);
    });
    return json({ granted: true });
  }

  if (!sslcommerzConfig()) throw new ApiError(503, "Online payment isn't available yet.");
  await db.payment.create({ data: { userId, tranId, plan: "pro", period, amount, currency: "BDT", coupon: coupon?.code ?? null } });

  const base = await appUrl();
  const url = await createSession({
    total_amount: amount.toFixed(2),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${base}/api/billing/sslcommerz/success`,
    fail_url: `${base}/api/billing/sslcommerz/fail`,
    cancel_url: `${base}/api/billing/sslcommerz/cancel`,
    ipn_url: `${base}/api/billing/sslcommerz/ipn`,
    product_name: period === "year" ? "Sanchay Pro (1 year)" : "Sanchay Pro (1 month)",
    product_category: "Software",
    product_profile: "non-physical-goods",
    shipping_method: "NO",
    num_of_item: "1",
    cus_name: user.name,
    cus_email: user.email,
    cus_phone: phone || "N/A",
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
  }).catch(async (err) => {
    await db.payment.update({ where: { tranId }, data: { status: "failed" } });
    console.error("[checkout]", err);
    throw new ApiError(502, "Couldn't reach the payment gateway. Please try again.");
  });
  return json({ url });
});
