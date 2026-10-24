import { describe, expect, it } from "vitest";
import { emailHash, normalizeEmail, randomToken, sha256Hex } from "./crypto-utils";
import { slugify } from "./slug";

const key = Buffer.alloc(32, 3);

describe("e-mail normalization and hash (concept chapter 7)", () => {
  it("trims, lower-cases and converts the domain to punycode", () => {
    expect(normalizeEmail("  Anna.Mueller@Müller-Bau.DE ")).toBe(
      "anna.mueller@xn--mller-bau-q9a.de",
    );
  });

  it("produces the same hash for equivalent addresses", () => {
    expect(emailHash(key, "Info@Firma.de")).toBe(emailHash(key, " info@firma.de"));
    expect(emailHash(key, "info@firma.de")).not.toBe(
      emailHash(Buffer.alloc(32, 4), "info@firma.de"),
    );
    expect(emailHash(key, "x@y.de")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("creates 128-bit url-safe tokens", () => {
    const token = randomToken();
    expect(Buffer.from(token, "base64url")).toHaveLength(16);
    expect(token).not.toBe(randomToken());
    expect(sha256Hex("a")).toHaveLength(64);
  });

  it("slugifies German names", () => {
    expect(slugify("Müller & Söhne GmbH")).toBe("mueller-soehne-gmbh");
    expect(slugify("!!!")).toBe("arbeitsbereich");
  });
});
