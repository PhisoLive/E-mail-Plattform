import { edgeEnvSchema, loadEnv } from "@ep/config/env";
import { createLogger } from "@ep/core";
import { createCoreRuntime } from "@ep/core/runtime";
import { serve } from "@hono/node-server";
import { createEdgeApp } from "./app";

const env = loadEnv(edgeEnvSchema, process.env, "edge");
const logger = createLogger("edge", env.LOG_LEVEL);
const runtime = createCoreRuntime(env, { applicationName: "emailplattform-edge", dbPoolSize: 5 });
const app = createEdgeApp(runtime.deps, runtime.redis);

const server = serve({ fetch: app.fetch, hostname: env.EDGE_HOST, port: env.EDGE_PORT }, (info) => {
  logger.info({ host: info.address, port: info.port, mode: env.MAIL_SEND_MODE }, "edge listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "edge shutting down");
  server.close();
  await runtime.close();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
