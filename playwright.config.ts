import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests (concept chapter 19). Started via `pnpm test:e2e` (scripts/e2e.ts), which prepares
 * the test stack, a fresh database and all environment variables.
 */
const webPort = process.env.WEB_PORT ?? "4400";
const edgePort = process.env.EDGE_PORT ?? "4401";
const workerPort = process.env.WORKER_PORT ?? "4402";
// Same rule as apps/web/scripts/e2e-serve.mjs: production build in CI, `next dev` locally.
const devServer = (process.env.E2E_WEB_MODE ?? (process.env.CI ? "production" : "dev")) === "dev";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  // `next dev` reloads open pages while it compiles routes for a parallel worker.
  workers: devServer ? 1 : 2,
  // `next dev` compiles each route on its first request (cold: up to ~20 s).
  timeout: devServer ? 180_000 : 90_000,
  expect: { timeout: devServer ? 45_000 : 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // run-app filters the environment per app (no MASTER_KEY in web and edge).
      command: "pnpm exec tsx scripts/run-app.ts edge start",
      url: `http://127.0.0.1:${edgePort}/health`,
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: "pipe",
    },
    {
      command: "pnpm exec tsx scripts/run-app.ts worker start",
      url: `http://127.0.0.1:${workerPort}/health`,
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: "pipe",
    },
    {
      command: "pnpm exec tsx scripts/run-app.ts web e2e:serve",
      url: `http://127.0.0.1:${webPort}/api/health`,
      timeout: 300_000,
      reuseExistingServer: false,
      stdout: "pipe",
    },
  ],
});
