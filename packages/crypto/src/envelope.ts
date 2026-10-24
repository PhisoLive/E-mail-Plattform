import { randomBytes } from "node:crypto";
import { decrypt, encrypt, type Sealed } from "./aead";

/**
 * Envelope encryption (concept chapter 16): one 256-bit data key (DEK) per workspace encrypts
 * passwords and tokens; the DEK itself is stored wrapped with the master key, which never
 * enters the database or the web app.
 */
export function generateDataKey(): Buffer {
  return randomBytes(32);
}

/** Wrapped DEK as `nonce.ciphertext` (base64). Bound to the workspace id via AAD. */
export function wrapDataKey(masterKey: Buffer, dataKey: Buffer, workspaceId: string): string {
  const sealed = encrypt(masterKey, dataKey, `dek:${workspaceId}`);
  return `${sealed.nonce}.${sealed.ciphertext}`;
}

export function unwrapDataKey(masterKey: Buffer, wrapped: string, workspaceId: string): Buffer {
  const [nonce, ciphertext] = wrapped.split(".");
  if (!nonce || !ciphertext) throw new Error("malformed wrapped data key");
  return decrypt(masterKey, { nonce, ciphertext }, `dek:${workspaceId}`);
}

/** Encrypts a secret with the workspace DEK; AAD binds it to workspace and secret id. */
export function encryptSecret(dataKey: Buffer, plaintext: string, binding: string): Sealed {
  return encrypt(dataKey, plaintext, `secret:${binding}`);
}

export function decryptSecret(dataKey: Buffer, sealed: Sealed, binding: string): string {
  return decrypt(dataKey, sealed, `secret:${binding}`).toString("utf8");
}
