import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { encryptSecret, generateTotpSecret, otpauthUri } from "@/lib/server/totp";

// Starts setup: stores a new (not yet active) secret and returns it for the authenticator app.
export const POST = authed(async ({ userId }) => {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, totpEnabledAt: true } });
  if (user.totpEnabledAt) throw new ApiError(400, "Two-step verification is already on.");
  const secret = generateTotpSecret();
  await db.user.update({ where: { id: userId }, data: { totpSecret: encryptSecret(secret), totpLastStep: null } });
  return json({ secret, uri: otpauthUri(secret, user.email) });
});
