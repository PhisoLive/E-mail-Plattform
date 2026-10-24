import sodium from "libsodium-wrappers";

/**
 * Sealed box with X25519 (libsodium `crypto_box_seal`, concept chapter 16): the web app
 * encrypts credentials right after input with the worker's public key; only the worker,
 * which holds the secret key, can open them.
 */
export async function sealForWorker(
  workerPublicKeyBase64: string,
  plaintext: string,
): Promise<string> {
  await sodium.ready;
  const publicKey = Buffer.from(workerPublicKeyBase64, "base64");
  if (publicKey.length !== 32) throw new Error("worker public key must be 32 bytes");
  return Buffer.from(sodium.crypto_box_seal(plaintext, publicKey)).toString("base64");
}

export async function openSealed(
  publicKeyBase64: string,
  secretKeyBase64: string,
  sealedBase64: string,
): Promise<string> {
  await sodium.ready;
  const opened = sodium.crypto_box_seal_open(
    Buffer.from(sealedBase64, "base64"),
    Buffer.from(publicKeyBase64, "base64"),
    Buffer.from(secretKeyBase64, "base64"),
  );
  return Buffer.from(opened).toString("utf8");
}
