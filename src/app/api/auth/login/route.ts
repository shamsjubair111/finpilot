import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { ApiError, handleError, json } from "@/lib/server/api";
import { createSession, setLangCookie } from "@/lib/server/session";
import { toProfile } from "@/lib/server/user";
import { rateLimit } from "@/lib/server/rate-limit";
import { signTwoFactorTicket } from "@/lib/server/session-token";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    await rateLimit("login", 30, 15 * 60 * 1000);
    const { email, password } = loginSchema.parse(await req.json());
    await rateLimit("login-email", 10, 15 * 60 * 1000, email);
    const user = await db.user.findUnique({ where: { email } });
    if (user && !user.passwordSet)
      throw new ApiError(400, "This account uses Google sign-in. Continue with Google, or use \"Forgot password\" to set a password.");
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new ApiError(401, "Incorrect email or password.");
    if (user.totpEnabledAt) return json({ twoFactorRequired: true, ticket: await signTwoFactorTicket(user.id) });
    await createSession(user.id);
    await setLangCookie(user.language);
    return json(toProfile(user));
  } catch (err) {
    return handleError(err);
  }
}
