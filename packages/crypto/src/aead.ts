import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** AES-256-GCM. The 16-byte auth tag is appended to the ciphertext (concept chapter 16). */
export interface Sealed {
  ciphertext: string;
  nonce: string;
}

const ALGORITHM = "aes-256-gcm";
const TAG_BYTES = 16;

function assertKey(key: Buffer): void {
  if (key.length !== 32) throw new Error("AES-256-GCM key must be 32 bytes");
}

export function encrypt(key: Buffer, plaintext: Buffer | string, associatedData?: string): Sealed {
  assertKey(key);
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: TAG_BYTES });
  if (associatedData) cipher.setAAD(Buffer.from(associatedData));
  const body = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  return { ciphertext: body.toString("base64"), nonce: nonce.toString("base64") };
}

export function decrypt(key: Buffer, sealed: Sealed, associatedData?: string): Buffer {
  assertKey(key);
  const body = Buffer.from(sealed.ciphertext, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(sealed.nonce, "base64"), {
    authTagLength: TAG_BYTES,
  });
  if (associatedData) decipher.setAAD(Buffer.from(associatedData));
  decipher.setAuthTag(body.subarray(body.length - TAG_BYTES));
  return Buffer.concat([
    decipher.update(body.subarray(0, body.length - TAG_BYTES)),
    decipher.final(),
  ]);
}
