import { describe, expect, it } from "vitest";
import {
  assertSendAllowed,
  checkSendAllowed,
  parseRecipients,
  SendBlockedError,
  type SendPolicy,
} from "./send-guard";
import { parseSmtpUrl } from "./system-mailer";

const sandbox: SendPolicy = {
  mode: "sandbox",
  allowlist: [],
  sandboxEndpoints: ["127.0.0.1:54025", "127.0.0.1:54102", "greenmail:3025"],
};

describe("MAIL_SEND_MODE guard", () => {
  it("sandbox only lets mail go to the GreenMail and Mailpit endpoints", () => {
    expect(
      checkSendAllowed(sandbox, {
        transportHost: "greenmail",
        transportPort: 3025,
        recipients: ["a@gmail.com"],
      }).ok,
    ).toBe(true);
    expect(
      checkSendAllowed(sandbox, {
        transportHost: "127.0.0.1",
        transportPort: 54102,
        recipients: ["a@gmail.com"],
      }).ok,
    ).toBe(true);
    // Same host, other port (e.g. a local MTA on 127.0.0.1:25) is not a sandbox.
    expect(
      checkSendAllowed(sandbox, {
        transportHost: "127.0.0.1",
        transportPort: 25,
        recipients: ["a@gmail.com"],
      }),
    ).toEqual({
      ok: false,
      error: { code: "SEND_BLOCKED_BY_MODE", params: { mode: "sandbox" } },
    });
    expect(
      checkSendAllowed(sandbox, {
        transportHost: "smtp.gmail.com",
        transportPort: 587,
        recipients: ["a@gmail.com"],
      }).ok,
    ).toBe(false);
    expect(() =>
      assertSendAllowed(sandbox, {
        transportHost: "mail.gmx.net",
        transportPort: 587,
        recipients: ["x@y.de"],
      }),
    ).toThrow(SendBlockedError);
  });

  it("allowlist only lets listed addresses and domains through – also inside address lists", () => {
    const policy: SendPolicy = {
      mode: "allowlist",
      allowlist: ["test@gmx.de", "@firma.de"],
      sandboxEndpoints: [],
    };
    const attempt = (recipients: string[]) =>
      checkSendAllowed(policy, { transportHost: "x", transportPort: 587, recipients });
    expect(attempt(["Test@GMX.de"]).ok).toBe(true);
    expect(attempt(["Anna <anna@firma.de>"]).ok).toBe(true);
    expect(attempt(["anna@firma.de", "kunde@web.de"]).ok).toBe(false);
    expect(attempt(["kunde@web.de, anna@firma.de"]).ok).toBe(false);
    expect(attempt(["Gruppe: kunde@web.de, anna@firma.de;"]).ok).toBe(false);
    expect(attempt(["anna@subfirma.de"]).ok).toBe(false);
  });

  it("refuses empty recipient lists", () => {
    expect(
      checkSendAllowed(
        { ...sandbox, mode: "live" },
        { transportHost: "x", transportPort: 1, recipients: [] },
      ).ok,
    ).toBe(false);
    expect(
      checkSendAllowed(
        { ...sandbox, mode: "live" },
        { transportHost: "x", transportPort: 1, recipients: [" "] },
      ).ok,
    ).toBe(false);
  });

  it("parses recipient lists like Nodemailer", () => {
    expect(parseRecipients(["a@b.de, Max <m@x.de>"])).toEqual(["a@b.de", "m@x.de"]);
  });
});

describe("SMTP URL parsing", () => {
  it("rejects query parameters that Nodemailer would treat as options", () => {
    expect(() => parseSmtpUrl("smtp://127.0.0.1:54102/?service=gmail")).toThrow(/query parameters/);
    expect(() => parseSmtpUrl("http://127.0.0.1:54102")).toThrow();
    expect(parseSmtpUrl("smtps://user:p%40ss@mail.example.com")).toEqual({
      host: "mail.example.com",
      port: 465,
      secure: true,
      auth: { user: "user", pass: "p@ss" },
    });
  });
});
