import type { WorkerEnv } from "@ep/config/env";
import type { CoreDeps, Logger, QueueName } from "@ep/core";
import type { Job } from "bullmq";

export interface WorkerContext {
  deps: CoreDeps;
  env: WorkerEnv;
  logger: Logger;
}

export type JobHandler = (job: Job, ctx: WorkerContext) => Promise<unknown>;

/** One file per queue (concept chapter 3): each exports its job handlers by job name. */
export interface QueueDefinition {
  queue: QueueName;
  handlers: Record<string, JobHandler>;
}
