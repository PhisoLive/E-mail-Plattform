import { createServer, type Server } from "node:http";
import { type CoreDeps, checkHealth } from "@ep/core";
import type { Redis } from "ioredis";
import type { RunningWorkers } from "./runner";

/** Health endpoint of the worker, bound to 127.0.0.1 in development. */
export function startHealthServer(
  deps: CoreDeps,
  redis: Redis,
  running: RunningWorkers,
  host: string,
  port: number,
): Server {
  const server = createServer(async (request, response) => {
    if (request.url !== "/health") {
      response.writeHead(404).end();
      return;
    }
    const report = await checkHealth(deps, redis);
    const workers = running.workers.map((worker) => ({
      queue: worker.name,
      running: worker.isRunning(),
    }));
    const healthy = report.status === "ok" && workers.every((worker) => worker.running);
    response
      .writeHead(healthy ? 200 : 503, { "content-type": "application/json" })
      .end(JSON.stringify({ ...report, status: healthy ? "ok" : "degraded", workers }));
  });
  server.listen(port, host);
  return server;
}
