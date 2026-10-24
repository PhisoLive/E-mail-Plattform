import { loadEnv, workerEnvSchema } from "@ep/config/env";
import { createLogger } from "@ep/core";
import { createCoreRuntime } from "@ep/core/runtime";
import { startHealthServer } from "./health-server";
import { startWorkers } from "./runner";

const env = loadEnv(workerEnvSchema, process.env, "worker");
const logger = createLogger("worker", env.LOG_LEVEL);
const runtime = createCoreRuntime(env, {
  applicationName: "emailplattform-worker",
  dbPoolSize: 20,
});
const running = await startWorkers(
  { deps: runtime.deps, env, logger },
  runtime.redis,
  env.WORKER_QUEUES,
);
const health = startHealthServer(
  runtime.deps,
  runtime.redis,
  running,
  env.WORKER_HOST,
  env.WORKER_PORT,
);
logger.info(
  {
    queues: running.workers.map((worker) => worker.name),
    mode: env.MAIL_SEND_MODE,
    port: env.WORKER_PORT,
  },
  "worker started",
);

let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, "worker shutting down");
  health.close();
  await running.close();
  await runtime.close();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
