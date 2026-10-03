import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

export type AuditAction =
  | "login"
  | "login_google"
  | "login_2fa"
  | "login_failed"
  | "password_changed"
  | "password_reset"
  | "sessions_revoked"
  | "2fa_enabled"
  | "2fa_disabled"
  | "data_exported"
  | "google_linked"
  | "email_changed";

/** Records a security event. Never throws: auditing must not break the action being audited. */
export async function audit(userId: string, action: AuditAction) {
  try {
    const h = await headers();
    await db.auditEvent.create({
      data: {
        userId,
        action,
        ip: (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null)?.slice(0, 64),
        userAgent: h.get("user-agent")?.slice(0, 200) ?? null,
      },
    });
  } catch (err) {
    console.error("[audit]", action, err);
  }
}
