import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { appUrl } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";
import { createSession, sslcommerzConfig } from "@/lib/server/sslcommerz";
import { PLANS } from "@/lib/plans";

const schema = z.object({
  period: z.enum(["month", "year"]),
  phone: z.string().trim().max(20).optional(),
});

// Creates a pending payment and an SSLCommerz session; the browser is sent to the returned URL.
export const POST = authed(async ({ userId, req }) => {
  if (!sslcommerzConfig()) throw new ApiError(503, "Online payment isn't available yet.");
  await rateLimit("checkout", 10, 60 * 60 * 1000, userId);
  const { period, phone } = schema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } });
  const amount = period === "year" ? PLANS.pro.priceYearly : PLANS.pro.priceMonthly;
  const tranId = `SNC${Date.now().toString(36).toUpperCase()}${randomBytes(4).toString("hex").toUpperCase()}`;
  await db.payment.create({ data: { userId, tranId, plan: "pro", period, amount, currency: "BDT" } });

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
