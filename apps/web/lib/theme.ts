import { themeColors } from "@ep/ui/theme-colors";

export type ThemePreference = "light" | "dark" | "system";
export const themeCookie = "ep_theme";

export function parseTheme(value: string | undefined | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/** Class for <html>: an explicit choice wins, otherwise the system preference applies via CSS. */
export function themeClass(theme: ThemePreference): string | undefined {
  return theme === "system" ? undefined : theme;
}

const schemes = ["light", "dark"] as const;

/** Colour of the browser bar per colour scheme: an explicit choice colours both entries. */
export function themeColorFor(theme: ThemePreference, scheme: (typeof schemes)[number]): string {
  return themeColors[theme === "system" ? scheme : theme];
}

export function themeColorEntries(theme: ThemePreference): { media: string; color: string }[] {
  return schemes.map((scheme) => ({
    media: `(prefers-color-scheme: ${scheme})`,
    color: themeColorFor(theme, scheme),
  }));
}
