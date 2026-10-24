export type ThemePreference = "light" | "dark" | "system";
export const themeCookie = "ep_theme";

export function parseTheme(value: string | undefined | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/** Class for <html>: an explicit choice wins, otherwise the system preference applies via CSS. */
export function themeClass(theme: ThemePreference): string | undefined {
  return theme === "system" ? undefined : theme;
}
