import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { grantPro } from "./plan-grants";

export const REFERRAL_DAYS = 30;
const MAX_REWARDS_PER_YEAR = 12;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid misreads

export async function getOrCreateReferralCode(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
    try {
      const { count } = await db.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } });
      if (count === 1) return code;
    } catch {
      // Code collision with another user: try a new one.
    }
    const again = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
    if (again.referralCode) return again.referralCode; // set concurrently
  }
  throw new Error("Couldn't create a referral code");
}

/** Finds the referrer for a code typed or linked at sign-up; ignores unknown codes. */
export async function referrerIdFor(code: string | null | undefined) {
  const clean = code?.trim().toUpperCase();
  if (!clean || !/^[A-Z0-9]{6,12}$/.test(clean)) return null;
  return (await db.user.findUnique({ where: { referralCode: clean }, select: { id: true } }))?.id ?? null;
}

/**
 * Pays the referral reward once the new user has verified their email: a free month for them and,
 * up to a yearly cap, for the person who invited them. Safe to call repeatedly.
 */
export async function rewardReferral(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referredById: true, referralRewardedAt: true, emailVerifiedAt: true } });
  if (!user?.referredById || user.referralRewardedAt || !user.emailVerifiedAt || user.referredById === userId) return;
  const referrerId = user.referredById;
  await db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({ where: { id: userId, referralRewardedAt: null }, data: { referralRewardedAt: new Date() } });
    if (count !== 1) return;
    const base = { days: REFERRAL_DAYS, amount: 0, currency: "BDT", grantedBy: "referral", source: "referral" };
    await grantPro({ ...base, userId, reference: `referred-by:${referrerId}` }, tx);
    const referrer = await tx.user.findUnique({ where: { id: referrerId }, select: { id: true } });
    const since = new Date(Date.now() - 365 * 86400000);
    const rewardedThisYear = await tx.planGrant.count({ where: { userId: referrerId, source: "referral", reference: { startsWith: "referred:" }, createdAt: { gte: since } } });
    if (referrer && rewardedThisYear < MAX_REWARDS_PER_YEAR) await grantPro({ ...base, userId: referrerId, reference: `referred:${userId}` }, tx);
  });
}
