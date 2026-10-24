import { describe, expect, it } from "vitest";
import { sanitizeDisplayName } from "./email-texts";

describe("display names in system mails", () => {
  it("removes line breaks and control characters and limits the length", () => {
    expect(sanitizeDisplayName("Max\r\nBcc: evil@x.de\u0000")).toBe("Max Bcc: evil@x.de");
    expect(sanitizeDisplayName("  Anna   Müller ")).toBe("Anna Müller");
    expect(sanitizeDisplayName("x".repeat(500))).toHaveLength(100);
  });
});
