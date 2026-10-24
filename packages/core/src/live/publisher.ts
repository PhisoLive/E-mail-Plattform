import { defaults } from "@ep/config/defaults";
import type { Redis } from "ioredis";

/** Live event types (concept chapter 15). Events carry only ids, states and counters – never mail contents. */
export type LiveEventType =
  | "message.updated"
  | "campaign.progress"
  | "inbox.new"
  | "approval.created"
  | "task.created"
  | "mailbox.status"
  | "agent.step"
  | "chat.delta"
  | "import.progress";

export type LiveValue = string | number | boolean | null;

export interface LiveEvent {
  type: LiveEventType;
  id?: string;
  status?: string;
  counts?: Record<string, number>;
  data?: Record<string, LiveValue>;
}

export interface LivePublisher {
  /** Publishes to `live:<workspaceId>` or, with `userId`, to `live:<workspaceId>:<userId>`. */
  publish(workspaceId: string, event: LiveEvent, options?: { userId?: string }): Promise<void>;
}

export function liveStreamKey(prefix: string, workspaceId: string, userId?: string): string {
  return userId ? `${prefix}:live:${workspaceId}:${userId}` : `${prefix}:live:${workspaceId}`;
}

/** Valkey stream publisher; trims entries older than `live.streamMinutes` via MINID. */
export function createValkeyLivePublisher(redis: Redis, prefix: string): LivePublisher {
  return {
    async publish(workspaceId, event, options) {
      const key = liveStreamKey(prefix, workspaceId, options?.userId);
      const minId = Date.now() - defaults.live.streamMinutes * 60_000;
      await redis.xadd(key, "MINID", "~", String(minId), "*", "event", JSON.stringify(event));
    },
  };
}

export interface MemoryLivePublisher extends LivePublisher {
  events: Array<{ workspaceId: string; userId?: string; event: LiveEvent }>;
}

export function createMemoryLivePublisher(): MemoryLivePublisher {
  const events: MemoryLivePublisher["events"] = [];
  return {
    events,
    async publish(workspaceId, event, options) {
      events.push(
        options?.userId ? { workspaceId, userId: options.userId, event } : { workspaceId, event },
      );
    },
  };
}
