import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot } from "./infra";

/** Loads the root `.env` into process.env (existing variables win). */
export function loadRootEnv(): void {
  const file = resolve(repoRoot, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set – run \`pnpm setup:env\``);
  return value;
}
