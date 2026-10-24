import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps relative app paths", () => {
    expect(safeNext("/einladung/abc?x=1")).toBe("/einladung/abc?x=1");
    expect(safeNext(null)).toBe("/start");
  });

  it("rejects everything that could leave the origin", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/\t/evil.example/phish",
      "/\n/evil.example",
      "javascript:alert(1)",
      "/%09/evil.example",
    ]) {
      const result = safeNext(value);
      expect(new URL(result, "https://plattform.invalid").origin).toBe("https://plattform.invalid");
    }
    expect(safeNext("/\t/evil.example/phish")).toBe("/start");
  });
});
