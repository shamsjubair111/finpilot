import { z } from "zod";
import { authed, json } from "@/lib/server/api";
import { discounted, findValidCoupon } from "@/lib/server/coupons";
import { rateLimit } from "@/lib/server/rate-limit";
import { PLANS } from "@/lib/plans";

// Checks a code and shows the discounted prices before paying.
export const POST = authed(async ({ actorId, req }) => {
  await rateLimit("coupon-check", 20, 60 * 60 * 1000, actorId);
  const { code } = z.object({ code: z.string().min(1).max(40) }).parse(await req.json());
  const coupon = await findValidCoupon(code);
  return json({
    code: coupon.code,
    percentOff: coupon.percentOff,
    month: discounted(PLANS.pro.priceMonthly, coupon.percentOff),
    year: discounted(PLANS.pro.priceYearly, coupon.percentOff),
  });
});
