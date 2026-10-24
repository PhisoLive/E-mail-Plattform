import { randomUUID } from "node:crypto";
import { testUrls } from "@ep/testing";
import { describe, expect, it } from "vitest";
import { SendBlockedError } from "./send-guard";
import { createSystemMailer } from "./system-mailer";

describe("system mailer", () => {
  it("delivers to Mailpit in sandbox mode", async () => {
    const mailer = createSystemMailer(testUrls.mailpitSmtp, "Plattform <no-reply@plattform.test>", {
      mode: "sandbox",
      allowlist: [],
      sandboxHosts: ["127.0.0.1"],
    });
    const subject = `Test ${randomUUID()}`;
    await mailer.send({ to: "anna@beispiel.test", subject, text: "Hallo" });
    mailer.close();
    const response = await fetch(
      `${testUrls.mailpitApi}/api/v1/search?query=${encodeURIComponent(`subject:"${subject}"`)}`,
    );
    const body = (await response.json()) as { messages: Array<{ Subject: string }> };
    expect(body.messages.map((message) => message.Subject)).toContain(subject);
  });

  it("refuses non-sandbox hosts in sandbox mode", async () => {
    const mailer = createSystemMailer("smtp://smtp.example.com:587", "x@y.z", {
      mode: "sandbox",
      allowlist: [],
      sandboxHosts: ["127.0.0.1"],
    });
    await expect(mailer.send({ to: "a@b.de", subject: "x", text: "y" })).rejects.toThrow(
      SendBlockedError,
    );
    mailer.close();
  });
});
