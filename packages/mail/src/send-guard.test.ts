import { describe, expect, it } from "vitest";
import {
  assertSendAllowed,
  checkSendAllowed,
  SendBlockedError,
  type SendPolicy,
} from "./send-guard";

const sandbox: SendPolicy = {
  mode: "sandbox",
  allowlist: [],
  sandboxHosts: ["127.0.0.1", "greenmail", "mailpit"],
};

describe("MAIL_SEND_MODE guard", () => {
  it("sandbox only lets mail go to GreenMail and Mailpit", () => {
    expect(
      checkSendAllowed(sandbox, { transportHost: "greenmail", recipients: ["a@gmail.com"] }).ok,
    ).toBe(true);
    expect(
      checkSendAllowed(sandbox, { transportHost: "127.0.0.1", recipients: ["a@gmail.com"] }).ok,
    ).toBe(true);
    expect(
      checkSendAllowed(sandbox, { transportHost: "smtp.gmail.com", recipients: ["a@gmail.com"] }),
    ).toEqual({
      ok: false,
      error: { code: "SEND_BLOCKED_BY_MODE", params: { mode: "sandbox" } },
    });
    expect(() =>
      assertSendAllowed(sandbox, { transportHost: "mail.gmx.net", recipients: ["x@y.de"] }),
    ).toThrow(SendBlockedError);
  });

  it("allowlist only lets listed addresses and domains through", () => {
    const policy: SendPolicy = {
      mode: "allowlist",
      allowlist: ["test@gmx.de", "@firma.de"],
      sandboxHosts: [],
    };
    expect(
      checkSendAllowed(policy, { transportHost: "mail.gmx.net", recipients: ["Test@GMX.de"] }).ok,
    ).toBe(true);
    expect(checkSendAllowed(policy, { transportHost: "x", recipients: ["anna@firma.de"] }).ok).toBe(
      true,
    );
    expect(
      checkSendAllowed(policy, {
        transportHost: "x",
        recipients: ["anna@firma.de", "kunde@web.de"],
      }).ok,
    ).toBe(false);
    expect(
      checkSendAllowed(policy, { transportHost: "x", recipients: ["anna@subfirma.de"] }).ok,
    ).toBe(false);
  });

  it("refuses empty recipient lists", () => {
    expect(
      checkSendAllowed({ ...sandbox, mode: "live" }, { transportHost: "x", recipients: [] }).ok,
    ).toBe(false);
  });
});
