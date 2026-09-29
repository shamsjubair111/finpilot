import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { appUrl } from "@/lib/server/email";
import { getOrCreateReferralCode, REFERRAL_DAYS } from "@/lib/server/referrals";

export const GET = authed(async ({ actorId }) => {
  const code = await getOrCreateReferralCode(actorId);
  const [joined, rewarded] = await Promise.all([
    db.user.count({ where: { referredById: actorId } }),
    db.user.count({ where: { referredById: actorId, referralRewardedAt: { not: null } } }),
  ]);
  return json({ code, link: `${await appUrl()}/register?ref=${code}`, joined, rewarded, days: REFERRAL_DAYS });
});
