import { sql } from "drizzle-orm";
import type { Redis } from "ioredis";
import type { CoreDeps } from "./context";

export interface HealthReport {
  status: "ok" | "degraded";
  checks: Record<string, "ok" | "fail">;
}

/** Health of the shared dependencies (database and Valkey). */
export async function checkHealth(deps: CoreDeps, redis?: Redis): Promise<HealthReport> {
  const checks: HealthReport["checks"] = {};
  try {
    await deps.db.execute(sql`select 1`);
    checks.database = "ok";
  } catch {
    checks.database = "fail";
  }
  if (redis) {
    try {
      checks.valkey = (await redis.ping()) === "PONG" ? "ok" : "fail";
    } catch {
      checks.valkey = "fail";
    }
  }
  const status = Object.values(checks).every((check) => check === "ok") ? "ok" : "degraded";
  return { status, checks };
}
