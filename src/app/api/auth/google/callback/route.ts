import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { appUrl, sendEmailQuietly, welcomeEmail } from "@/lib/server/email";
import { GOOGLE_STATE_COOKIE, googleConfig, safeNext } from "@/lib/server/google";
import { rateLimit } from "@/lib/server/rate-limit";
import { createSession, setLangCookie } from "@/lib/server/session";
import { signTwoFactorTicket } from "@/lib/server/session-token";
import { isLang, LANG_COOKIE } from "@/lib/i18n";
import { TRIAL_DAYS, trialEndDate } from "@/lib/plans";

interface GoogleProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function GET(req: Request) {
  const base = await appUrl();
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, base));
  const config = googleConfig();
  if (!config) return fail("google");

  const url = new URL(req.url);
  const jar = await cookies();
  let saved: { state: string; verifier: string; next: string } | null = null;
  try {
    saved = JSON.parse(jar.get(GOOGLE_STATE_COOKIE)?.value ?? "null");
  } catch {
    saved = null;
  }
  jar.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
  if (!saved || !url.searchParams.get("code") || url.searchParams.get("state") !== saved.state) return fail("google");

  try {
    await rateLimit("google", 30, 15 * 60 * 1000);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: url.searchParams.get("code")!,
        code_verifier: saved.verifier,
        grant_type: "authorization_code",
        redirect_uri: `${base}/api/auth/google/callback`,
      }),
    });
    if (!tokenRes.ok) return fail("google");
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!profileRes.ok) return fail("google");
    const profile = (await profileRes.json()) as GoogleProfile;
    if (!profile.sub || !profile.email || !profile.email_verified) return fail("google_email");
    const email = profile.email.toLowerCase();

    // Match by Google ID first, then link an existing account with the same (Google-verified) email.
    let user = await db.user.findUnique({ where: { googleId: profile.sub } });
    if (!user) {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        user = await db.user.update({
          where: { id: existing.id },
          data: { googleId: profile.sub, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
        });
      } else {
        const lang = jar.get(LANG_COOKIE)?.value;
        user = await db.user.create({
          data: {
            name: (profile.name ?? email.split("@")[0]).slice(0, 60),
            email,
            googleId: profile.sub,
            avatarUrl: profile.picture ?? null,
            language: isLang(lang) ? lang : "en",
            emailVerifiedAt: new Date(),
            passwordSet: false,
            // Unusable random password: the user can set a real one later through "Forgot password".
            passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
            plan: "pro",
            planExpiresAt: trialEndDate(),
          },
        });
        sendEmailQuietly({ to: user.email, ...welcomeEmail(user.language === "bn" ? "bn" : "en", user.name, null, TRIAL_DAYS, base) });
      }
    }

    if (user.totpEnabledAt) {
      const ticket = await signTwoFactorTicket(user.id);
      return NextResponse.redirect(new URL(`/login?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(saved.next)}`, base));
    }
    await createSession(user.id);
    await setLangCookie(user.language);
    return NextResponse.redirect(new URL(safeNext(saved.next), base));
  } catch (err) {
    console.error("[google]", err);
    return fail("google");
  }
}
