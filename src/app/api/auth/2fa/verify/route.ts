import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, handleError, json } from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { createSession, setLangCookie } from "@/lib/server/session";
import { verifyTwoFactorTicket } from "@/lib/server/session-token";
import { decryptSecret, hashRecoveryCode, verifyTotp } from "@/lib/server/totp";
import { toProfile } from "@/lib/server/user";

const schema = z.object({ ticket: z.string().min(1).max(2000), code: z.string().trim().min(6).max(20) });

// Second step of sign-in: a 6-digit app code or a recovery code, exchanged for a session.
export async function POST(req: Request) {
  try {
    const { ticket, code } = schema.parse(await req.json());
    const userId = await verifyTwoFactorTicket(ticket);
    if (!userId) throw new ApiError(401, "Your sign-in took too long. Please enter your password again.");
    await rateLimit("2fa-verify", 5, 15 * 60 * 1000, userId);
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabledAt || !user.totpSecret) throw new ApiError(401, "Your sign-in took too long. Please enter your password again.");

    let ok = false;
    const step = /^\d{6}$/.test(code.replace(/\s+/g, "")) ? verifyTotp(decryptSecret(user.totpSecret), code, Date.now(), user.totpLastStep) : null;
    if (step !== null) {
      // Conditional update so two requests can't both use the same code.
      const { count } = await db.user.updateMany({
        where: { id: userId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
        data: { totpLastStep: step },
      });
      ok = count === 1;
    } else {
      const hash = hashRecoveryCode(code);
      if (user.recoveryCodes.includes(hash)) {
        const { count } = await db.user.updateMany({
          where: { id: userId, recoveryCodes: { has: hash } },
          data: { recoveryCodes: user.recoveryCodes.filter((c) => c !== hash) },
        });
        ok = count === 1;
      }
    }
    if (!ok) throw new ApiError(400, "That code didn't match. Try the newest code from your app, or a recovery code.");

    await createSession(user.id);
    await setLangCookie(user.language);
    return json(toProfile(await db.user.findUniqueOrThrow({ where: { id: user.id } })));
  } catch (err) {
    return handleError(err);
  }
}
