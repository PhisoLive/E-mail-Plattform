import { type CoreDeps, checkHealth } from "@ep/core";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import type { Redis } from "ioredis";

/**
 * Public endpoints (concept chapter 15): unsubscribe (/u), click redirect (/c), webhooks.
 * Runs separately from the web app and must always be reachable.
 */
export function createEdgeApp(deps: CoreDeps, redis?: Redis): Hono {
  const app = new Hono();
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
      referrerPolicy: "strict-origin-when-cross-origin",
    }),
  );
  app.get("/health", async (c) => {
    const report = await checkHealth(deps, redis);
    return c.json(report, report.status === "ok" ? 200 : 503);
  });
  // No text in code: public pages of the edge service get their texts from de.json (phase 4).
  app.notFound((c) => c.body(null, 404));
  return app;
}
