import type { MailSendMode } from "@ep/config/env";
import { appError, err, normalizeEmail, ok, type Result } from "@ep/core";
import addressparser from "nodemailer/lib/addressparser";

/**
 * Send switch (concept chapter 18, CLAUDE.md): without an explicit `live` no mail leaves the
 * system. Every transport – system mails and customer mailboxes – calls this before sending.
 */
export interface SendPolicy {
  mode: MailSendMode;
  /** `address@domain` or `@domain` entries (staging). */
  allowlist: readonly string[];
  /** `host:port` endpoints of the mail sandboxes (GreenMail, Mailpit) – only these in sandbox mode. */
  sandboxEndpoints: readonly string[];
}

export interface SendAttempt {
  /** Host and port of the SMTP server or API endpoint the mail is handed to. */
  transportHost: string;
  transportPort: number;
  /** Address fields as given to the transport; lists are parsed like Nodemailer does. */
  recipients: readonly string[];
}

/** Every mailbox address in the recipient fields (groups and lists flattened). */
export function parseRecipients(recipients: readonly string[]): string[] {
  return recipients.flatMap((field) =>
    addressparser(field, { flatten: true })
      .map((entry) => entry.address.trim())
      .filter((address) => address.length > 0),
  );
}

function matchesAllowlist(recipient: string, allowlist: readonly string[]): boolean {
  const address = normalizeEmail(recipient);
  const domain = address.slice(address.lastIndexOf("@"));
  return allowlist.some((entry) => {
    const normalized = entry.startsWith("@") ? entry.toLowerCase() : normalizeEmail(entry);
    return normalized === address || normalized === domain;
  });
}

export function endpointKey(host: string, port: number): string {
  return `${host.toLowerCase()}:${port}`;
}

export function checkSendAllowed(policy: SendPolicy, attempt: SendAttempt): Result<true> {
  const addresses = parseRecipients(attempt.recipients);
  if (addresses.length === 0) return err(appError("VALIDATION"));
  switch (policy.mode) {
    case "live":
      return ok(true);
    case "allowlist": {
      const blocked = addresses.filter(
        (recipient) => !matchesAllowlist(recipient, policy.allowlist),
      );
      return blocked.length === 0
        ? ok(true)
        : err(appError("SEND_BLOCKED_BY_MODE", { mode: "allowlist", count: blocked.length }));
    }
    case "sandbox": {
      const endpoint = endpointKey(attempt.transportHost, attempt.transportPort);
      return policy.sandboxEndpoints.map((entry) => entry.toLowerCase()).includes(endpoint)
        ? ok(true)
        : err(appError("SEND_BLOCKED_BY_MODE", { mode: "sandbox" }));
    }
  }
}

export class SendBlockedError extends Error {
  constructor(public readonly mode: MailSendMode) {
    super(`mail blocked by MAIL_SEND_MODE=${mode}`);
    this.name = "SendBlockedError";
  }
}

export function assertSendAllowed(policy: SendPolicy, attempt: SendAttempt): void {
  const result = checkSendAllowed(policy, attempt);
  if (!result.ok) throw new SendBlockedError(policy.mode);
}
