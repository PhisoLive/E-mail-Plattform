import type { BaseEnv } from "@ep/config/env";
import { createDatabase } from "@ep/db";
import { Redis } from "ioredis";
import { type CoreDeps, systemClock } from "./context";
import { createBullJobQueue } from "./jobs/bullmq";
import { createValkeyLivePublisher } from "./live/publisher";

export interface CoreRuntime {
  deps: CoreDeps;
  redis: Redis;
  close(): Promise<void>;
}

/** Creates database, Valkey connection, job queue and live publisher for one process. */
export function createCoreRuntime(
  env: BaseEnv,
  options: { applicationName: string; dbPoolSize?: number },
): CoreRuntime {
  const database = createDatabase(env.DATABASE_URL, {
    applicationName: options.applicationName,
    ...(options.dbPoolSize ? { max: options.dbPoolSize } : {}),
  });
  // maxRetriesPerRequest: null is required by BullMQ workers.
  const redis = new Redis(env.VALKEY_URL, { maxRetriesPerRequest: null, lazyConnect: false });
  const queue = createBullJobQueue(redis, env.VALKEY_PREFIX);
  const deps: CoreDeps = {
    db: database.db,
    live: createValkeyLivePublisher(redis, env.VALKEY_PREFIX),
    queue,
    emailHashKey: Buffer.from(env.EMAIL_HASH_KEY, "base64"),
    clock: systemClock,
  };
  return {
    deps,
    redis,
    async close() {
      await queue.close();
      await database.close();
      redis.disconnect();
    },
  };
}
