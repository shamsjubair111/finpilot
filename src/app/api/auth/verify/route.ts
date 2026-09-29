import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { consumeToken } from "@/lib/server/auth-tokens";

// Opened from the email link, so it redirects to a page rather than returning JSON.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = await consumeToken(url.searchParams.get("token") ?? "", "verify_email").catch(() => null);
  if (userId) await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.redirect(new URL(userId ? "/?verified=1" : "/?verified=0", url));
}
