"use client";

import { useCallback, useSyncExternalStore } from "react";
import { setPreferenceCookie } from "./preference-cookie";
import { parseTheme, type ThemePreference, themeCookie } from "./theme";

const listeners = new Set<() => void>();
/** Last choice in this tab – the Cookie Store API writes asynchronously. */
let chosen: ThemePreference | null = null;

function readCookie(): ThemePreference {
  if (chosen) return chosen;
  const match = document.cookie.match(new RegExp(`(?:^|; )${themeCookie}=([^;]*)`));
  return parseTheme(match?.[1]);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Applies a theme: cookie (so the server renders the right class, no flash) and <html> class. */
export function applyTheme(next: ThemePreference): void {
  chosen = next;
  setPreferenceCookie(themeCookie, next);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (next !== "system") root.classList.add(next);
  for (const listener of listeners) listener();
}

/** Theme preference shared by every component (user menu, command palette, profile page). */
export function useTheme(): [ThemePreference, (theme: ThemePreference) => void] {
  const theme = useSyncExternalStore(subscribe, readCookie, () => "system" as const);
  const setTheme = useCallback((next: ThemePreference) => applyTheme(next), []);
  return [theme, setTheme];
}
