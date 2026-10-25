import { describe, expect, it } from "vitest";
import { hex, tokens } from "./test-color";
import { themeColors } from "./theme-colors";

function background(selector: string): string {
  const bg = tokens(selector).bg;
  if (!bg) throw new Error(`--ep-bg missing in ${selector}`);
  return hex(bg);
}

describe("theme colours", () => {
  it("match the page background token in light and dark mode", () => {
    expect(themeColors.light).toBe(background(":root"));
    expect(themeColors.dark).toBe(background(":root.dark"));
  });
});
