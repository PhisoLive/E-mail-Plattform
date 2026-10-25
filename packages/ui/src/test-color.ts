import { readFileSync } from "node:fs";

/** Colour helpers for tests: read the oklch tokens of styles.css and compute WCAG values. */
export const stylesCss = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

type Oklch = [lightness: number, chroma: number, hue: number];

/** Tokens (`--ep-<name>: oklch(…)`) of the first block with this selector. */
export function tokens(selector: string): Record<string, Oklch> {
  const start = stylesCss.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} missing in styles.css`);
  const block = stylesCss.slice(start, stylesCss.indexOf("}", start));
  const found: Record<string, Oklch> = {};
  for (const match of block.matchAll(/--ep-([\w-]+): oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g)) {
    found[match[1] ?? ""] = [Number(match[2]), Number(match[3]), Number(match[4])];
  }
  return found;
}

/** oklch → linear sRGB (OKLab), clamped to the gamut. */
export function linearRgb([lightness, chroma, hue]: Oklch): [number, number, number] {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function hex(color: Oklch): string {
  return `#${linearRgb(color)
    .map((value) => {
      const gamma = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
      return Math.round(gamma * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

/** WCAG 2 contrast ratio. */
export function contrast(first: Oklch, second: Oklch): number {
  const luminance = (color: Oklch) => {
    const [r, g, b] = linearRgb(color);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [lighter, darker] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}
