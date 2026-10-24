import "server-only";
import { loadEnv, type WebEnv, webEnvSchema } from "@ep/config/env";

let cached: WebEnv | undefined;

/**
 * Validated environment of the web app. Startup fails if MASTER_KEY or SEALED_BOX_SECRET_KEY
 * are present – the web app can only encrypt for the worker (concept chapter 16).
 */
export function webEnv(): WebEnv {
  cached ??= loadEnv(webEnvSchema, process.env, "web");
  return cached;
}
