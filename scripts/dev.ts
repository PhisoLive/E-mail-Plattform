/**
 * `pnpm dev` – starts everything with one command (concept chapter 20, phase 0):
 * generates .env if missing, starts the Compose dev stack (127.0.0.1 only), migrates and seeds
 * the database, then runs web, edge and worker in watch mode.
 */
import { spawn } from "node:child_process";
import { type AppName, envForApp } from "@ep/config/env";
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

// Each app gets only its own secrets: the web app never sees MASTER_KEY or the sealed-box
// secret key, the edge service no auth secret (concept chapter 16).
const apps: AppName[] = ["web", "edge", "worker"];
const children = apps.map((app) => {
  const child = spawn("pnpm", ["--filter", `@ep/${app}`, "dev"], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: envForApp(app, process.env),
  });
  const prefix = `[${app}] `;
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    let buffer = "";
    stream.on("data", (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) process.stdout.write(`${prefix}${line}\n`);
    });
  }
  return child;
});

let stopping = false;
function stopAll(signal: NodeJS.Signals) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => stopAll(signal));
for (const child of children) {
  child.on("exit", (code) => {
    if (!stopping) {
      console.error(`an app exited with code ${code ?? 0} – stopping all`);
      stopAll("SIGTERM");
      process.exitCode = code ?? 1;
    }
  });
}
