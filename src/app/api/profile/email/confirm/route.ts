import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { consumeTokenWithData } from "@/lib/server/auth-tokens";
import { appUrl, emailChangedNotice, sendEmailQuietly } from "@/lib/server/email";

// Step 2: the link from the new inbox. Proves the user controls the new address, then switches it.
export async function GET(req: Request) {
  const base = await appUrl();
  const result = await consumeTokenWithData(new URL(req.url).searchParams.get("token") ?? "", "change_email").catch(() => null);
  const newEmail = result?.data;
  if (!result || !newEmail) return NextResponse.redirect(new URL("/settings?email=failed", base));
  const user = await db.user.findUnique({ where: { id: result.userId }, select: { email: true, name: true, language: true } });
  if (!user) return NextResponse.redirect(new URL("/settings?email=failed", base));
  try {
    await db.user.update({ where: { id: result.userId }, data: { email: newEmail, emailVerifiedAt: new Date() } });
  } catch {
    // Someone else took the address in the meantime.
    return NextResponse.redirect(new URL("/settings?email=taken", base));
  }
  await audit(result.userId, "email_changed");
  // Tell the old address, in case this wasn't the account owner.
  sendEmailQuietly({ to: user.email, ...emailChangedNotice(user.language === "bn" ? "bn" : "en", user.name, newEmail) });
  return NextResponse.redirect(new URL("/settings?email=changed", base));
}
