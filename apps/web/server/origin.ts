import "server-only";
import { webEnv } from "./env";

/** CSRF protection for state-changing requests: Origin must be our own (concept chapter 16). */
export function isSameOrigin(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS")
    return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(webEnv().WEB_URL).origin;
}
