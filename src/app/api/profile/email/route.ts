import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { issueToken } from "@/lib/server/auth-tokens";
import { appUrl, changeEmailEmail, sendEmail } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";

const schema = z.object({
  newEmail: z.email("must be a valid email").trim().toLowerCase(),
  password: z.string().min(1, "is required"),
});

// Step 1 of changing the sign-in email: check the password, then send a link to the new address.
export const POST = authed(async ({ actorId, req }) => {
  await rateLimit("email-change", 5, 60 * 60 * 1000, actorId);
  const { newEmail, password } = schema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: actorId }, select: { email: true, name: true, language: true, passwordHash: true, passwordSet: true } });
  if (!user.passwordSet) throw new ApiError(400, "You signed up with Google. Use \"Forgot password\" to set a password first.");
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(403, "Password is incorrect.");
  if (newEmail === user.email) throw new ApiError(400, "That's already your email address.");
  if (await db.user.findUnique({ where: { email: newEmail }, select: { id: true } })) throw new ApiError(409, "Another account already uses that email.");
  const token = await issueToken(actorId, "change_email", newEmail);
  const lang = user.language === "bn" ? "bn" : "en";
  await sendEmail({ to: newEmail, ...changeEmailEmail(lang, user.name, newEmail, `${await appUrl()}/api/profile/email/confirm?token=${token}`) });
  return json({ ok: true });
});
