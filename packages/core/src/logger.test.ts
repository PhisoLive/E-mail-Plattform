import { Writable } from "node:stream";
import pino from "pino";
import { describe, expect, it } from "vitest";
import { redactedPaths } from "./logger";

describe("logger redaction", () => {
  it("never writes passwords, tokens, mail contents or addresses", () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(String(chunk));
        callback();
      },
    });
    const logger = pino({ redact: { paths: redactedPaths, censor: "[redacted]" } }, stream);
    logger.info(
      {
        password: "geheim123",
        token: "tok_abc",
        headers: { authorization: "Bearer x" },
        email: "anna@firma.de",
        nested: { text: "Hallo Anna" },
      },
      "test",
    );
    const output = lines.join("");
    for (const secret of ["geheim123", "tok_abc", "Bearer x", "anna@firma.de", "Hallo Anna"]) {
      expect(output).not.toContain(secret);
    }
  });
});
