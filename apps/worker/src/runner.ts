import { defaults } from "@ep/config/defaults";
import { type QueueName, queueNames } from "@ep/core";
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";
import { queueDefinitions } from "./queues/index";
import type { WorkerContext } from "./queues/types";
import { schedules } from "./schedules/index";

export interface RunningWorkers {
  workers: Worker[];
  queues: Map<QueueName, Queue>;
  close(): Promise<void>;
}

/** Starts one BullMQ worker per queue with the concurrency from defaults (concept chapter 15). */
export async function startWorkers(
  ctx: WorkerContext,
  connection: Redis,
  enabled: readonly string[],
): Promise<RunningWorkers> {
  const prefix = `${ctx.env.VALKEY_PREFIX}:bull`;
  const workers: Worker[] = [];
  const queues = new Map<QueueName, Queue>();
  for (const definition of queueDefinitions) {
    if (enabled.length > 0 && !enabled.includes(definition.queue)) continue;
    const worker = new Worker(
      definition.queue,
      async (job) => {
        const handler = definition.handlers[job.name];
        if (!handler) throw new Error(`no handler for ${definition.queue}/${job.name}`);
        return handler(job, ctx);
      },
      { connection, prefix, concurrency: defaults.queues.concurrency[definition.queue] },
    );
    worker.on("failed", (job, error) => {
      ctx.logger.warn(
        { queue: definition.queue, job: job?.name, jobId: job?.id, error: error.name },
        "job failed",
      );
    });
    workers.push(worker);
  }
  for (const name of queueNames) {
    queues.set(name, new Queue(name, { connection, prefix }));
  }
  for (const schedule of schedules) {
    if (enabled.length > 0 && !enabled.includes(schedule.queue)) continue;
    const queue = queues.get(schedule.queue);
    if (!queue) continue;
    await queue.upsertJobScheduler(
      schedule.id,
      schedule.pattern
        ? { pattern: schedule.pattern, tz: defaults.schedules.timezone }
        : { every: schedule.everyMs ?? defaults.schedules.syncDispatcherSeconds * 1000 },
      { name: schedule.jobName, data: {} },
    );
  }
  return {
    workers,
    queues,
    async close() {
      // Running jobs may finish (max. 60 s, concept chapter 18); no new jobs are taken.
      await Promise.race([
        Promise.all(workers.map((worker) => worker.close())),
        new Promise((resolve) => setTimeout(resolve, defaults.queues.shutdownGraceSeconds * 1000)),
      ]);
      await Promise.all([...queues.values()].map((queue) => queue.close()));
    },
  };
}
