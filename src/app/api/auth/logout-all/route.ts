import { authed, json } from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { revokeSessions } from "@/lib/server/session";

// Signs out every other device while keeping this one signed in.
export const POST = authed(async ({ userId }) => {
  await revokeSessions(userId, true);
  await audit(userId, "sessions_revoked");
  return json({ ok: true });
});
