import "server-only";
import { loadEnv, type WebEnv, webEnvSchema } from "@ep/config/env";

let cached: WebEnv | undefined;

/** Validated environment of the web app. The web app never receives MASTER_KEY. */
export function webEnv(): WebEnv {
  cached ??= loadEnv(webEnvSchema);
  return cached;
}
