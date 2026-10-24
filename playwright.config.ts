import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests (concept chapter 19). Started via `pnpm test:e2e` (scripts/e2e.ts), which prepares
 * the test stack, a fresh database and all environment variables.
 */
const webPort = process.env.WEB_PORT ?? "4400";
const edgePort = process.env.EDGE_PORT ?? "4401";
const workerPort = process.env.WORKER_PORT ?? "4402";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 2,
  timeout: 90_000,
  expect: { timeout: 15_000 },
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
      command: "pnpm --filter @ep/edge start",
      url: `http://127.0.0.1:${edgePort}/health`,
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: "pipe",
    },
    {
      command: "pnpm --filter @ep/worker start",
      url: `http://127.0.0.1:${workerPort}/health`,
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: "pipe",
    },
    {
      command: "pnpm --filter @ep/web e2e:serve",
      url: `http://127.0.0.1:${webPort}/api/health`,
      timeout: 300_000,
      reuseExistingServer: false,
      stdout: "pipe",
    },
  ],
});
