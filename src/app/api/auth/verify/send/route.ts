import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { issueToken } from "@/lib/server/auth-tokens";
import { appUrl, sendEmail, verificationEmail } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";

export const POST = authed(async ({ userId }) => {
  await rateLimit("verify-send", 3, 60 * 60 * 1000, userId);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.emailVerifiedAt) throw new ApiError(400, "Your email is already confirmed.");
  const token = await issueToken(userId, "verify_email");
  const lang = user.language === "bn" ? "bn" : "en";
  await sendEmail({ to: user.email, ...verificationEmail(lang, user.name, `${await appUrl()}/api/auth/verify?token=${token}`) });
  return json({ ok: true });
});
