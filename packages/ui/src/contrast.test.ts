import { describe, expect, it } from "vitest";
import { contrast, tokens } from "./test-color";

/*
 * WCAG 2.2 AA from the tokens (concept chapter 13). axe and Lighthouse do not measure the
 * contrast of controls and states (1.4.11), so the pairs are checked here directly.
 */
const text = 4.5;
const control = 3;
const pairs: Array<[foreground: string, background: string, minimum: number]> = [
  ...["bg", "surface", "surface-muted", "sidebar"].flatMap(
    (background): Array<[string, string, number]> => [
      ["text", background, text],
      ["text-muted", background, text],
      ["text-subtle", background, text],
    ],
  ),
  ...["accent-soft", "success-soft", "warning-soft", "info-soft", "danger-soft"].map(
    (background): [string, string, number] => ["text", background, text],
  ),
  ["accent-text", "accent", text],
  ["accent-text", "accent-hover", text],
  ["accent-strong-text", "accent-soft", text],
  ["accent-strong-text", "surface", text],
  ["on-danger", "danger", text],
  ["danger", "surface", text],
  ["danger", "danger-soft", text],
  // Boundaries of fields, switch track, chosen segment
  ...["bg", "surface", "surface-muted", "surface-hover", "sidebar"].map(
    (background): [string, string, number] => ["border-control", background, control],
  ),
  // Keyboard position in menus and the palette, focus ring
  ["accent", "surface-hover", control],
  ["focus", "bg", control],
  ["focus", "surface", control],
  ["focus", "sidebar", control],
];

describe.each([
  ["light", tokens(":root")],
  ["dark", { ...tokens(":root"), ...tokens(":root.dark") }],
])("contrast of the tokens (%s)", (_mode, palette) => {
  it.each(pairs)("%s on %s reaches %d:1", (foreground, background, minimum) => {
    const first = palette[foreground];
    const second = palette[background];
    if (!first || !second) throw new Error(`token missing: ${foreground} or ${background}`);
    expect(contrast(first, second)).toBeGreaterThanOrEqual(minimum);
  });
});

it("uses the same dark tokens for the system preference as for the explicit choice", () => {
  expect(tokens(":root:not(.light)")).toEqual(tokens(":root.dark"));
});
