import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, readSession, signSession } from "./session-token";
import { db } from "./db";
import { LANG_COOKIE } from "@/lib/i18n";

export async function setLangCookie(lang: string) {
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function createSession(userId: string, version?: number) {
  const sv = version ?? (await db.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } }))?.sessionVersion ?? 0;
  (await cookies()).set(SESSION_COOKIE, await signSession(userId, sv), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

// Which household's finances are shown; see resolveLedger in api.ts.
export const LEDGER_COOKIE = "sanchay_ledger";

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(LEDGER_COOKIE);
}

export async function getSession() {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Invalidates every existing session for the user; pass keepCurrent to re-issue this device's cookie. */
export async function revokeSessions(userId: string, keepCurrent = false) {
  const { sessionVersion } = await db.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  if (keepCurrent) await createSession(userId, sessionVersion);
}
