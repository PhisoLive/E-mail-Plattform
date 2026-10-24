import nodemailer from "nodemailer";
import { assertSendAllowed, type SendPolicy } from "./send-guard";

/**
 * System mails (login links, verification, invitations) – strictly separate from customer
 * sending (concept chapter 3). Development and test: Mailpit. Production: EU transactional
 * service via SMTP (e.g. Amazon SES Frankfurt).
 */
export interface SystemMail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SystemMailer {
  send(mail: SystemMail): Promise<void>;
  close(): void;
}

export function createSystemMailer(
  smtpUrl: string,
  from: string,
  policy: SendPolicy,
): SystemMailer {
  const url = new URL(smtpUrl);
  const transport = nodemailer.createTransport(smtpUrl);
  return {
    async send(mail) {
      assertSendAllowed(policy, { transportHost: url.hostname, recipients: [mail.to] });
      await transport.sendMail({
        from,
        to: mail.to,
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
