/**
 * `pnpm dev` – starts everything with one command (concept chapter 20, phase 0):
 * generates .env if missing, starts the Compose dev stack (127.0.0.1 only), migrates and seeds
 * the database, then runs web, edge and worker in watch mode.
 */
import { spawn } from "node:child_process";
import { runMigrations } from "@ep/db/migrate";
import { runSeed } from "@ep/db/seed";
import { assertPortsFree, infraUp, repoRoot } from "@ep/testing/infra";
import { loadRootEnv, requireEnv } from "./lib/env";
import { ensureDevEnv } from "./setup-env";

ensureDevEnv();
loadRootEnv();
if (process.env.MAIL_SEND_MODE !== "sandbox") {
  throw new Error("MAIL_SEND_MODE must be sandbox in development");
}

await infraUp("dev");
await runMigrations(requireEnv("DATABASE_URL"));
await runSeed(requireEnv("DATABASE_URL"));
await assertPortsFree({
  web: Number(requireEnv("WEB_PORT")),
  edge: Number(requireEnv("EDGE_PORT")),
  worker: Number(requireEnv("WORKER_PORT")),
});

const child = spawn(
  "pnpm",
  [
    "exec",
    "turbo",
    "run",
    "dev",
    "--filter=@ep/web",
    "--filter=@ep/edge",
    "--filter=@ep/worker",
    "--ui=stream",
  ],
  { cwd: repoRoot, stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));
