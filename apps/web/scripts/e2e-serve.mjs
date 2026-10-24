// Serves the web app for E2E tests: production build in CI, dev server locally (faster).
import { spawn, spawnSync } from "node:child_process";

const host = process.env.WEB_HOST ?? "127.0.0.1";
const port = process.env.WEB_PORT ?? "4400";
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
const mode = process.env.E2E_WEB_MODE ?? (process.env.CI ? "production" : "dev");

if (mode === "production") {
  const build = spawnSync("pnpm", ["exec", "next", "build"], { stdio: "inherit", env });
  if (build.status !== 0) process.exit(build.status ?? 1);
  spawn("pnpm", ["exec", "next", "start", "-H", host, "-p", port], { stdio: "inherit", env }).on(
    "exit",
    (code) => process.exit(code ?? 0),
  );
} else {
  spawn("pnpm", ["exec", "next", "dev", "-H", host, "-p", port], { stdio: "inherit", env }).on(
    "exit",
    (code) => process.exit(code ?? 0),
  );
}
