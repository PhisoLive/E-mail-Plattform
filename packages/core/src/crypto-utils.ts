import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { domainToASCII } from "node:url";

/** Normalizes an e-mail address: trimmed, lower case, domain as punycode (concept chapter 7). */
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = domainToASCII(trimmed.slice(at + 1)) || trimmed.slice(at + 1);
  return `${local}@${domain}`;
}

/**
 * `email_hash` = HMAC-SHA256 with the secret platform key over the normalized address.
 * This is the only place where the hash is formed (concept chapter 7).
 */
export function emailHash(key: Buffer, email: string): string {
  return createHmac("sha256", key).update(normalizeEmail(email)).digest("hex");
}

/** Random, URL-safe token. 16 bytes = 128 bit (unsubscribe links), 32 bytes for invitations. */
export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Hash of an IP address for audit logs – never the plain IP. */
export function ipHash(key: Buffer, ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return createHmac("sha256", key).update(`ip:${ip}`).digest("hex").slice(0, 32);
}
