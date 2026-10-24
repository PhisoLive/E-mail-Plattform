import {
  type Clock,
  type CoreDeps,
  createMemoryJobQueue,
  createMemoryLivePublisher,
  type MemoryJobQueue,
  type MemoryLivePublisher,
} from "@ep/core";
import { createDatabase, type DatabaseHandle } from "@ep/db";
import { testDatabaseUrl, testKeys } from "./env";

export interface TestDeps extends CoreDeps {
  live: MemoryLivePublisher;
  queue: MemoryJobQueue;
}

/** Controllable clock for scheduler and limit tests ("künstliche Uhr", concept chapter 21). */
export class TestClock implements Clock {
  constructor(private current = new Date()) {}
  now(): Date {
    return new Date(this.current);
  }
  set(date: Date | string): void {
    this.current = new Date(date);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

let shared: DatabaseHandle | undefined;

export function testDatabase(): DatabaseHandle {
  shared ??= createDatabase(testDatabaseUrl(), { max: 5, applicationName: "emailplattform-test" });
  return shared;
}

export function createTestDeps(clock: Clock = new TestClock()): TestDeps {
  return {
    db: testDatabase().db,
    live: createMemoryLivePublisher(),
    queue: createMemoryJobQueue(),
    emailHashKey: Buffer.from(testKeys.emailHashKey, "base64"),
    clock,
  };
}

export async function closeTestDatabase(): Promise<void> {
  await shared?.close();
  shared = undefined;
}
