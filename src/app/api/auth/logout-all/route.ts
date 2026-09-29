import { authed, json } from "@/lib/server/api";
import { revokeSessions } from "@/lib/server/session";

// Signs out every other device while keeping this one signed in.
export const POST = authed(async ({ userId }) => {
  await revokeSessions(userId, true);
  return json({ ok: true });
});
