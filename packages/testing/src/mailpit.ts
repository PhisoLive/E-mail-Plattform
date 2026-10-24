import { testUrls } from "./env";

export interface MailpitMessage {
  ID: string;
  Subject: string;
  To: Array<{ Address: string; Name: string }>;
  Created: string;
}

/** Small client for the Mailpit API (system mails in development and tests). */
export class MailpitClient {
  constructor(private readonly baseUrl = testUrls.mailpitApi) {}

  async search(query: string): Promise<MailpitMessage[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/search?query=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error(`mailpit search failed: ${response.status}`);
    const body = (await response.json()) as { messages: MailpitMessage[] };
    return body.messages;
  }

  async text(id: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/v1/message/${id}`);
    if (!response.ok) throw new Error(`mailpit message failed: ${response.status}`);
    const body = (await response.json()) as { Text: string };
    return body.Text;
  }

  /** Waits for the newest mail to `to` (optionally with a subject) and returns its text. */
  async waitForMail(
    to: string,
    options: { subject?: string; timeoutMs?: number; after?: Date } = {},
  ): Promise<string> {
    const deadline = Date.now() + (options.timeoutMs ?? 15_000);
    const query = options.subject ? `to:"${to}" subject:"${options.subject}"` : `to:"${to}"`;
    while (Date.now() < deadline) {
      const messages = (await this.search(query)).filter(
        (message) => !options.after || new Date(message.Created) >= options.after,
      );
      const newest = messages[0];
      if (newest) return this.text(newest.ID);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`no mail to ${to} within timeout`);
  }

  /** First http(s) link in a mail text. */
  static firstLink(text: string): string {
    const match = /https?:\/\/[^\s<>"]+/.exec(text);
    if (!match) throw new Error("no link in mail");
    return match[0];
  }
}
