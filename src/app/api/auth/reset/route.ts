import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, handleError, json } from "@/lib/server/api";
import { consumeToken } from "@/lib/server/auth-tokens";
import { rateLimit } from "@/lib/server/rate-limit";
import { revokeSessions } from "@/lib/server/session";

const schema = z.object({
  token: z.string().min(1, "is required").max(200),
  password: z.string().min(8, "must be at least 8 characters").max(128),
});

export async function POST(req: Request) {
  try {
    await rateLimit("reset", 10, 15 * 60 * 1000);
    const { token, password } = schema.parse(await req.json());
    const userId = await consumeToken(token, "reset_password");
    if (!userId) throw new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");
    // Following the emailed link proves ownership of the address, so confirm it too.
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date() },
    });
    await db.authToken.deleteMany({ where: { userId, type: "reset_password", usedAt: null } });
    // Sign out every device, in case someone else had access to the old password.
    await revokeSessions(userId);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
