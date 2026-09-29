import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { decryptSecret, generateRecoveryCodes, hashRecoveryCode, verifyTotp } from "@/lib/server/totp";

const schema = z.object({ code: z.string().trim().min(6).max(10) });

// Confirms the app is set up by checking a code, then turns 2FA on and returns one-time recovery codes.
export const POST = authed(async ({ userId, req }) => {
  await rateLimit("2fa-enable", 10, 15 * 60 * 1000, userId);
  const { code } = schema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { totpSecret: true, totpEnabledAt: true } });
  if (user.totpEnabledAt) throw new ApiError(400, "Two-step verification is already on.");
  if (!user.totpSecret) throw new ApiError(400, "Start setup again to get a new code.");
  const step = verifyTotp(decryptSecret(user.totpSecret), code);
  if (step === null) throw new ApiError(400, "That code didn't match. Check your phone's time and try the newest code.");
  const recoveryCodes = generateRecoveryCodes();
  await db.user.update({
    where: { id: userId },
    data: { totpEnabledAt: new Date(), totpLastStep: step, recoveryCodes: recoveryCodes.map(hashRecoveryCode) },
  });
  await audit(userId, "2fa_enabled");
  return json({ recoveryCodes });
});
