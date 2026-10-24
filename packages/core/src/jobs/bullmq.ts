import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import {
  assertValidJobId,
  defaultJobOptions,
  type JobQueue,
  type QueueName,
  queueNames,
} from "./queue";

/** Job queue backed by BullMQ on Valkey. Job data never contains plaintext credentials. */
export function createBullJobQueue(
  connection: Redis,
  prefix: string,
): JobQueue & { close(): Promise<void> } {
  const queues = new Map<QueueName, Queue>();
  const get = (name: QueueName) => {
    let queue = queues.get(name);
    if (!queue) {
      queue = new Queue(name, {
        connection,
        prefix: `${prefix}:bull`,
        defaultJobOptions: defaultJobOptions(name),
      });
      queues.set(name, queue);
    }
    return queue;
  };
  return {
    async enqueue(queue, name, data, options) {
      assertValidJobId(options.jobId);
      if (!queueNames.includes(queue)) throw new Error(`unknown queue ${queue}`);
      await get(queue).add(name, data, {
        jobId: options.jobId,
        ...(options.delayMs ? { delay: options.delayMs } : {}),
        ...(options.priority ? { priority: options.priority } : {}),
      });
    },
    async close() {
      await Promise.all([...queues.values()].map((queue) => queue.close()));
    },
  };
}
