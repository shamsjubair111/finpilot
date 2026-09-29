import { describe, expect, it } from "vitest";
import { readSession, signSession, signTwoFactorTicket, verifyTwoFactorTicket } from "@/lib/server/session-token";

process.env.AUTH_SECRET ??= "test-secret-for-unit-tests-only-32chars";

describe("session tokens", () => {
  it("keeps sessions and 2FA tickets apart", async () => {
    const session = await signSession("u1", 3);
    const ticket = await signTwoFactorTicket("u1");
    expect(await readSession(session)).toEqual({ userId: "u1", version: 3 });
    expect(await readSession(ticket)).toBeNull();
    expect(await verifyTwoFactorTicket(ticket)).toBe("u1");
    expect(await verifyTwoFactorTicket(session)).toBeNull();
    expect(await readSession("garbage")).toBeNull();
  });
});
