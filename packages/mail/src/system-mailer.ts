import nodemailer from "nodemailer";
import { assertSendAllowed, parseRecipients, type SendPolicy } from "./send-guard";

/**
 * System mails (login links, verification, invitations) – strictly separate from customer
 * sending (concept chapter 3). Development and test: Mailpit. Production: EU transactional
 * service via SMTP (e.g. Amazon SES Frankfurt).
 */
export interface SystemMail {
  /** Exactly one recipient address. */
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SystemMailer {
  send(mail: SystemMail): Promise<void>;
  close(): void;
}

export interface SmtpEndpoint {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
}

/**
 * Parses `smtp://` or `smtps://` URLs. Query parameters are rejected: Nodemailer would read
 * them as options (e.g. `service=`) and could connect somewhere else than the guard checked.
 */
export function parseSmtpUrl(smtpUrl: string): SmtpEndpoint {
  const url = new URL(smtpUrl);
  if (url.protocol !== "smtp:" && url.protocol !== "smtps:")
    throw new Error("SMTP URL must use smtp: or smtps:");
  if (url.search || url.hash) throw new Error("SMTP URL must not contain query parameters");
  const secure = url.protocol === "smtps:";
  const port = url.port ? Number(url.port) : secure ? 465 : 587;
  const endpoint: SmtpEndpoint = { host: url.hostname, port, secure };
  if (url.username)
    endpoint.auth = {
      user: decodeURIComponent(url.username),
      pass: decodeURIComponent(url.password),
    };
  return endpoint;
}

export function createSystemMailer(
  smtpUrl: string,
  from: string,
  policy: SendPolicy,
): SystemMailer {
  const endpoint = parseSmtpUrl(smtpUrl);
  const transport = nodemailer.createTransport({
    host: endpoint.host,
    port: endpoint.port,
    secure: endpoint.secure,
    ...(endpoint.auth ? { auth: endpoint.auth } : {}),
  });
  return {
    async send(mail) {
      const addresses = parseRecipients([mail.to]);
      if (addresses.length !== 1) throw new Error("system mails have exactly one recipient");
      const [to] = addresses as [string];
      assertSendAllowed(policy, {
        transportHost: endpoint.host,
        transportPort: endpoint.port,
        recipients: [to],
      });
      await transport.sendMail({
        from,
        to,
        envelope: { from: parseRecipients([from])[0] ?? from, to: [to] },
        subject: mail.subject,
        text: mail.text,
        ...(mail.html ? { html: mail.html } : {}),
        headers: { "Auto-Submitted": "auto-generated" },
      });
    },
    close() {
      transport.close();
    },
  };
}
