import "server-only";
import { db } from "./db";
import { ApiError } from "./api";

export const normaliseCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

/** Returns a usable coupon or throws a user-facing error. */
export async function findValidCoupon(code: string) {
  const coupon = await db.coupon.findUnique({ where: { code: normaliseCode(code) } });
  if (!coupon || !coupon.active) throw new ApiError(400, "That code isn't valid.");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, "That code has expired.");
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) throw new ApiError(400, "That code has been fully used.");
  return coupon;
}

export const discounted = (price: number, percentOff: number) => Math.max(0, Math.round(price * (100 - percentOff)) / 100);
