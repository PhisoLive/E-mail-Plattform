/**
 * Queue names and the job enqueue interface (concept chapter 15). Postgres is the truth:
 * jobs only execute and can always be rebuilt from the database (`pnpm ops:rebuild-queues`).
 */
import { defaults } from "@ep/config/defaults";

export const queueNames = [
  "send",
  "schedule",
  "sync",
  "inbound",
  "ai",
  "import",
  "deliverability",
  "notify",
  "maintenance",
] as const;

export type QueueName = (typeof queueNames)[number];

export interface EnqueueOptions {
  /** Business id of the job, e.g. `send-<messageId>-<attempt>`. Must not contain ":". */
  jobId: string;
  delayMs?: number;
  priority?: number;
}

export interface JobQueue {
  enqueue(
    queue: QueueName,
    name: string,
    data: Record<string, unknown>,
    options: EnqueueOptions,
  ): Promise<void>;
}

/** BullMQ forbids ":" in custom job ids (concept chapter 2). */
export function assertValidJobId(jobId: string): void {
  if (jobId.length === 0 || jobId.includes(":")) {
    throw new Error(`invalid job id "${jobId}" – job ids are business ids without ":"`);
  }
}

export const jobIds = {
  send: (messageId: string, attempt: number) => `send-${messageId}-${attempt}`,
  schedule: (tick: number) => `schedule-${tick}`,
  sync: (mailboxId: string, slot: number) => `sync-${mailboxId}-${slot}`,
  inbound: (messageId: string) => `inbound-${messageId}`,
  maintenance: (task: string, day: string) => `maintenance-${task}-${day}`,
};

export function defaultJobOptions(queue: QueueName) {
  return {
    attempts: defaults.queues.attempts[queue],
    backoff: { type: "exponential" as const, delay: defaults.queues.backoffBaseMs, jitter: 0.5 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  };
}

export interface MemoryJobQueue extends JobQueue {
  jobs: Array<{
    queue: QueueName;
    name: string;
    data: Record<string, unknown>;
    options: EnqueueOptions;
  }>;
}

export function createMemoryJobQueue(): MemoryJobQueue {
  const jobs: MemoryJobQueue["jobs"] = [];
  return {
    jobs,
    async enqueue(queue, name, data, options) {
      assertValidJobId(options.jobId);
      if (!jobs.some((job) => job.queue === queue && job.options.jobId === options.jobId)) {
        jobs.push({ queue, name, data, options });
      }
    },
  };
}
