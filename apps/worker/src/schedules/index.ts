import { defaults } from "@ep/config/defaults";
import type { QueueName } from "@ep/core";

/** Recurring jobs (concept chapter 15). Registered idempotently as BullMQ job schedulers. */
export interface ScheduleDefinition {
  id: string;
  queue: QueueName;
  jobName: string;
  pattern?: string;
  everyMs?: number;
}

export const schedules: ScheduleDefinition[] = [
  {
    id: "retention-daily",
    queue: "maintenance",
    jobName: "retention",
    pattern: defaults.schedules.retentionCron,
  },
];
