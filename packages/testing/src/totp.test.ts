import { describe, expect, it } from "vitest";
import { secretFromOtpauth, totp } from "./totp";

describe("totp", () => {
  it("matches the RFC 6238 test vector", () => {
    // RFC 6238 SHA-1 secret "12345678901234567890" in base32.
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(totp(secret, 59_000, 30, 8)).toBe("94287082");
    expect(totp(secret, 1_111_111_109_000, 30, 8)).toBe("07081804");
  });

  it("reads the secret from an otpauth uri", () => {
    expect(secretFromOtpauth("otpauth://totp/App:a%40b.de?secret=ABCDEF&issuer=App")).toBe(
      "ABCDEF",
    );
  });
});
