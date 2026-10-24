import type { MailSendMode } from "@ep/config/env";
import { appError, err, normalizeEmail, ok, type Result } from "@ep/core";

/**
 * Send switch (concept chapter 18, CLAUDE.md): without an explicit `live` no mail leaves the
 * system. Every transport – system mails and customer mailboxes – calls this before sending.
 */
export interface SendPolicy {
  mode: MailSendMode;
  /** `address@domain` or `@domain` entries (staging). */
  allowlist: readonly string[];
  /** SMTP hosts that are mail sandboxes (GreenMail, Mailpit). */
  sandboxHosts: readonly string[];
}

export interface SendAttempt {
  /** Host of the SMTP server or API endpoint the mail is handed to. */
  transportHost: string;
  recipients: readonly string[];
}

function matchesAllowlist(recipient: string, allowlist: readonly string[]): boolean {
  const address = normalizeEmail(recipient);
  const domain = address.slice(address.lastIndexOf("@"));
  return allowlist.some((entry) => {
    const normalized = entry.startsWith("@") ? entry.toLowerCase() : normalizeEmail(entry);
    return normalized === address || normalized === domain;
  });
}

export function checkSendAllowed(policy: SendPolicy, attempt: SendAttempt): Result<true> {
  if (attempt.recipients.length === 0) return err(appError("VALIDATION"));
  switch (policy.mode) {
    case "live":
      return ok(true);
    case "allowlist": {
      const blocked = attempt.recipients.filter(
        (recipient) => !matchesAllowlist(recipient, policy.allowlist),
      );
      return blocked.length === 0
        ? ok(true)
        : err(appError("SEND_BLOCKED_BY_MODE", { mode: "allowlist", count: blocked.length }));
    }
    case "sandbox": {
      const host = attempt.transportHost.toLowerCase();
      return policy.sandboxHosts.includes(host)
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
