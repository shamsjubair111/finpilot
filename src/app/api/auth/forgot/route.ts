import { z } from "zod";
import { db } from "@/lib/server/db";
import { handleError, json } from "@/lib/server/api";
import { issueToken } from "@/lib/server/auth-tokens";
import { appUrl, resetEmail, sendEmail } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";

const schema = z.object({ email: z.email("must be a valid email").trim().toLowerCase() });

export async function POST(req: Request) {
  try {
    await rateLimit("forgot", 10, 15 * 60 * 1000);
    const { email } = schema.parse(await req.json());
    await rateLimit("forgot-email", 3, 60 * 60 * 1000, email);
    const user = await db.user.findUnique({ where: { email } });
    // Same response whether or not the account exists, so this can't be used to discover emails.
    if (user) {
      const token = await issueToken(user.id, "reset_password");
      const lang = user.language === "bn" ? "bn" : "en";
      await sendEmail({ to: user.email, ...resetEmail(lang, user.name, `${await appUrl()}/reset-password?token=${token}`) });
    }
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
