import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sanchay_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string, version = 0) {
  return new SignJWT({ sub: userId, sv: version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** Checks the signature and expiry only; callers with database access also compare the session version. */
export async function readSession(token: string | undefined): Promise<{ userId: string; version: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    // Other token kinds (e.g. 2FA tickets) share the signing key but must never count as a session.
    if (typeof payload.sub !== "string" || payload.purpose !== undefined) return null;
    // Tokens issued before session versions existed carry no "sv" and count as version 0.
    return { userId: payload.sub, version: typeof payload.sv === "number" ? payload.sv : 0 };
  } catch {
    return null;
  }
}

export async function verifySession(token: string | undefined): Promise<string | null> {
  return (await readSession(token))?.userId ?? null;
}

// Short-lived proof that the password step passed, exchanged for a session once the 2FA code checks out.
const TICKET_MAX_AGE = 5 * 60;

export async function signTwoFactorTicket(userId: string) {
  return new SignJWT({ sub: userId, purpose: "2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TICKET_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyTwoFactorTicket(ticket: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(ticket, secretKey(), { algorithms: ["HS256"] });
    return payload.purpose === "2fa" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
