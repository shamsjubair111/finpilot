import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/server/email";
import { GOOGLE_STATE_COOKIE, googleConfig, pkcePair, safeNext } from "@/lib/server/google";

// Starts "Continue with Google": remembers state + PKCE verifier in a short-lived cookie, then redirects to Google.
export async function GET(req: Request) {
  const base = await appUrl();
  const config = googleConfig();
  if (!config) return NextResponse.redirect(new URL("/login?error=google", base));

  const state = randomBytes(16).toString("base64url");
  const { verifier, challenge } = pkcePair();
  const params = new URL(req.url).searchParams;
  const next = safeNext(params.get("next"));
  const ref = params.get("ref")?.slice(0, 20) ?? null;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${base}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(auth);
  res.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, verifier, next, ref }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 10 * 60,
  });
  return res;
}
