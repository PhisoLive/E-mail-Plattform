import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./aead";
import {
  decryptSecret,
  encryptSecret,
  generateDataKey,
  unwrapDataKey,
  wrapDataKey,
} from "./envelope";
import { openSealed, sealForWorker } from "./sealed-box";

function x25519() {
  const { publicKey, privateKey } = generateKeyPairSync("x25519");
  return {
    publicKey: Buffer.from(publicKey.export({ format: "jwk" }).x as string, "base64url").toString(
      "base64",
    ),
    secretKey: Buffer.from(privateKey.export({ format: "jwk" }).d as string, "base64url").toString(
      "base64",
    ),
  };
}

describe("AES-256-GCM", () => {
  it("round-trips and detects tampering", () => {
    const key = generateDataKey();
    const sealed = encrypt(key, "geheim", "aad");
    expect(decrypt(key, sealed, "aad").toString()).toBe("geheim");
    expect(sealed.ciphertext).not.toContain("geheim");
    expect(() => decrypt(key, sealed, "other")).toThrow();
    const bytes = Buffer.from(sealed.ciphertext, "base64");
    bytes[0] = (bytes[0] ?? 0) ^ 1;
    expect(() =>
      decrypt(key, { ...sealed, ciphertext: bytes.toString("base64") }, "aad"),
    ).toThrow();
  });
});

describe("envelope encryption", () => {
  it("wraps the data key per workspace", () => {
    const master = generateDataKey();
    const dek = generateDataKey();
    const wrapped = wrapDataKey(master, dek, "ws-1");
    expect(unwrapDataKey(master, wrapped, "ws-1").equals(dek)).toBe(true);
    expect(() => unwrapDataKey(master, wrapped, "ws-2")).toThrow();
    expect(() => unwrapDataKey(generateDataKey(), wrapped, "ws-1")).toThrow();
  });

  it("binds secrets to their id", () => {
    const dek = generateDataKey();
    const sealed = encryptSecret(dek, "App-Passwort-123", "ws-1:secret-1");
    expect(decryptSecret(dek, sealed, "ws-1:secret-1")).toBe("App-Passwort-123");
    expect(() => decryptSecret(dek, sealed, "ws-1:secret-2")).toThrow();
  });
});

describe("sealed box", () => {
  it("can only be opened with the worker secret key", async () => {
    const worker = x25519();
    const sealed = await sealForWorker(worker.publicKey, "mein-passwort");
    expect(sealed).not.toContain("mein-passwort");
    expect(await openSealed(worker.publicKey, worker.secretKey, sealed)).toBe("mein-passwort");
    const other = x25519();
    await expect(openSealed(other.publicKey, other.secretKey, sealed)).rejects.toThrow();
  });
});
