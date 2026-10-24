import { testUrls } from "./env";

/** Client for the GreenMail REST API (test mailboxes for SMTP/IMAP, concept chapter 19). */
export class GreenMailClient {
  constructor(private readonly baseUrl = testUrls.greenmailApi) {}

  async createUser(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/user`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, login: email, password }),
    });
    if (!response.ok && response.status !== 409) {
      throw new Error(`greenmail create user failed: ${response.status}`);
    }
  }

  async deleteUser(email: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(email)}`, { method: "DELETE" });
  }

  async messages(
    email: string,
    folder = "INBOX",
  ): Promise<Array<{ subject: string; mimeMessage: string; messageId?: string }>> {
    const response = await fetch(
      `${this.baseUrl}/api/user/${encodeURIComponent(email)}/messages/${encodeURIComponent(folder)}/`,
    );
    if (!response.ok) return [];
    return (await response.json()) as Array<{
      subject: string;
      mimeMessage: string;
      messageId?: string;
    }>;
  }

  async purge(): Promise<void> {
    await fetch(`${this.baseUrl}/api/mail/purge`, { method: "POST" });
  }
}
