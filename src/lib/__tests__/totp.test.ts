import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, decryptSecret, encryptSecret, hashRecoveryCode, hotp, verifyTotp } from "@/lib/server/totp";

process.env.AUTH_SECRET ??= "test-secret-for-unit-tests-only-32chars";

// RFC 6238 appendix B, SHA-1 seed "12345678901234567890".
const seed = Buffer.from("12345678901234567890");
const seed32 = base32Encode(seed);

describe("totp", () => {
  it("round-trips base32", () => {
    expect(base32Decode(seed32).equals(seed)).toBe(true);
    expect(seed32).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });

  it("matches RFC 6238 vectors (last 6 digits)", () => {
    expect(hotp(seed, Math.floor(59 / 30), 8)).toBe("94287082");
    expect(hotp(seed, Math.floor(1111111109 / 30), 8)).toBe("07081804");
    expect(hotp(seed, Math.floor(1234567890 / 30), 8)).toBe("89005924");
  });

  it("accepts the adjacent step and rejects replays", () => {
    const now = 1234567890 * 1000;
    const code = hotp(seed, Math.floor(1234567890 / 30));
    const step = verifyTotp(seed32, code, now);
    expect(step).toBe(Math.floor(1234567890 / 30));
    expect(verifyTotp(seed32, code, now + 30_000)).toBe(step);
    expect(verifyTotp(seed32, code, now, step)).toBeNull();
    expect(verifyTotp(seed32, "000000", now)).toBeNull();
    expect(verifyTotp(seed32, "12ab56", now)).toBeNull();
  });

  it("encrypts secrets and normalises recovery codes", () => {
    const enc = encryptSecret(seed32);
    expect(enc).not.toContain(seed32);
    expect(decryptSecret(enc)).toBe(seed32);
    expect(hashRecoveryCode(" AB12c-D34ef ")).toBe(hashRecoveryCode("ab12c-d34ef"));
  });
});
