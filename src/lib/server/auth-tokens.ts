import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export type TokenType = "verify_email" | "reset_password";

const TTL_MS: Record<TokenType, number> = { verify_email: 24 * 60 * 60 * 1000, reset_password: 60 * 60 * 1000 };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Issues a new token and invalidates older unused ones of the same type. Returns the raw token for the link. */
export async function issueToken(userId: string, type: TokenType) {
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.authToken.create({ data: { userId, type, tokenHash: hash(token), expiresAt: new Date(Date.now() + TTL_MS[type]) } }),
  ]);
  return token;
}

/** Marks a valid token as used and returns its user ID, or null if it is unknown, used or expired. */
export async function consumeToken(token: string, type: TokenType) {
  if (!token || token.length > 200) return null;
  const now = new Date();
  // updateMany with the validity conditions makes consumption atomic: a token can only be used once.
  const row = await db.authToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!row || row.type !== type) return null;
  const { count } = await db.authToken.updateMany({
    where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  return count === 1 ? row.userId : null;
}
