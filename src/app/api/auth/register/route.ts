import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { ApiError, handleError, json } from "@/lib/server/api";
import { createSession, setLangCookie } from "@/lib/server/session";
import { toProfile } from "@/lib/server/user";
import { rateLimit } from "@/lib/server/rate-limit";
import { registerSchema } from "@/lib/validation";
import { TRIAL_DAYS, trialEndDate } from "@/lib/plans";
import { issueToken } from "@/lib/server/auth-tokens";
import { referrerIdFor } from "@/lib/server/referrals";
import { appUrl, sendEmailQuietly, welcomeEmail } from "@/lib/server/email";

export async function POST(req: Request) {
  try {
    await rateLimit("register", 10, 15 * 60 * 1000);
    const { name, email, password, language, currency, ref } = registerSchema.parse(await req.json());
    if (await db.user.findUnique({ where: { email } }))
      throw new ApiError(409, "An account with this email already exists. Try signing in.");
    const user = await db.user.create({
      data: { name, email, language, currency, plan: "pro", planExpiresAt: trialEndDate(), referredById: await referrerIdFor(ref), passwordHash: await bcrypt.hash(password, 12) },
    });
    const token = await issueToken(user.id, "verify_email");
    sendEmailQuietly({ to: user.email, ...welcomeEmail(language, name, `${await appUrl()}/api/auth/verify?token=${token}`, TRIAL_DAYS) });
    await createSession(user.id);
    await setLangCookie(user.language);
    return json(toProfile(user), 201);
  } catch (err) {
    return handleError(err);
  }
}
