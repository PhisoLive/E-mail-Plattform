/**
 * Starts one app with only its own environment: `tsx scripts/run-app.ts <web|edge|worker> <script>`.
 * The child gets a filtered copy of the environment (never MASTER_KEY in web, concept chapter 16).
 */
import { spawn } from "node:child_process";
import { type AppName, envForApp } from "@ep/config/env";
import { repoRoot } from "@ep/testing/infra";

const [app, script] = process.argv.slice(2);
if (app !== "web" && app !== "edge" && app !== "worker")
  throw new Error("usage: run-app <web|edge|worker> <script>");
if (!script) throw new Error("script missing");

const child = spawn("pnpm", ["--filter", `@ep/${app}`, script], {
  cwd: repoRoot,
  stdio: "inherit",
  env: envForApp(app as AppName, process.env),
});
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
