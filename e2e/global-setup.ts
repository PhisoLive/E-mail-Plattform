import type { FullConfig } from "@playwright/test";

/**
 * `next dev` compiles a route on its first request and may reload open pages meanwhile. Against
 * the dev server the public pages are requested once before the tests start.
 */
const warmUp = [
  "/",
  "/login",
  "/login/zwei-faktor",
  "/registrieren",
  "/passwort-vergessen",
  "/preise",
  "/api/auth/get-session",
];

export default async function globalSetup(config: FullConfig): Promise<void> {
  const mode = process.env.E2E_WEB_MODE ?? (process.env.CI ? "production" : "dev");
  if (mode !== "dev") return;
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;
  for (const path of warmUp) {
    await fetch(new URL(path, baseURL), { redirect: "manual" }).catch(() => undefined);
  }
}
