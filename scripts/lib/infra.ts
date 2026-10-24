import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { assertPortsFree } from "./ports";
import { type StackName, stacks } from "./stacks";

export const repoRoot = resolve(import.meta.dirname, "..", "..");

function dockerAvailable(): boolean {
  return spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
}

function composeArgs(name: StackName): string[] {
  const stack = stacks[name];
  const args = ["compose", "-p", stack.project, "-f", resolve(repoRoot, stack.file)];
  const envFile = resolve(repoRoot, ".env");
  if (name === "dev" && existsSync(envFile)) args.push("--env-file", envFile);
  return args;
}

function stackEnv(name: StackName): NodeJS.ProcessEnv {
  const stack = stacks[name];
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const [key, port] of Object.entries(stack.ports)) {
    const variable = stack.portEnv[key as keyof typeof stack.ports];
    env[variable] = env[variable] ?? String(port);
  }
  return env;
}

export function runningServices(name: StackName): string[] {
  const output = execFileSync(
    "docker",
    [...composeArgs(name), "ps", "--status", "running", "--services"],
    {
      env: stackEnv(name),
      encoding: "utf8",
    },
  );
  return output.split("\n").filter(Boolean);
}

export async function infraUp(name: StackName): Promise<void> {
  if (!dockerAvailable()) {
    throw new Error(
      "Docker is not available. Install Docker and start the daemon (concept chapter 23).",
    );
  }
  const stack = stacks[name];
  const running = new Set(runningServices(name));
  if (running.size === 0) {
    await assertPortsFree({ ...stack.ports });
  }
  const result = spawnSync(
    "docker",
    [...composeArgs(name), "up", "-d", "--wait", "--wait-timeout", "180"],
    {
      env: stackEnv(name),
      stdio: "inherit",
    },
  );
  if (result.status !== 0) throw new Error(`docker compose up failed for stack ${name}`);
}

export function infraDown(name: StackName, removeVolumes = false): void {
  const args = [...composeArgs(name), "down"];
  if (removeVolumes) args.push("-v");
  spawnSync("docker", args, { env: stackEnv(name), stdio: "inherit" });
}
