"use client";

import { defaults } from "@ep/config/defaults";

/**
 * Stores a UI preference (theme, sidebar) in a cookie so the server renders the right state.
 * Uses the Cookie Store API where available.
 */
export function setPreferenceCookie(name: string, value: string): void {
  const maxAge = defaults.cookies.preferenceDays * 24 * 60 * 60;
  const secure = window.location.protocol === "https:";
  if ("cookieStore" in window) {
    void window.cookieStore.set({
      name,
      value,
      path: "/",
      sameSite: "lax",
      expires: Date.now() + maxAge * 1000,
    });
    return;
  }
  // biome-ignore lint/suspicious/noDocumentCookie: fallback for browsers without the Cookie Store API.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure ? "; secure" : ""}`;
}
