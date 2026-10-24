import type { Tx } from "@ep/db";
import { sql } from "drizzle-orm";
import type { UserContext, WorkspaceContext } from "./context";

/**
 * A transaction bound to exactly one workspace. Services receive a scope and must filter
 * every query by `scope.workspaceId` (tenant tests check this for every procedure).
 */
export interface WorkspaceScope {
  readonly tx: Tx;
  readonly ctx: WorkspaceContext;
  readonly workspaceId: string;
  /** Runs after a successful commit (live events, job enqueueing). */
  afterCommit(callback: () => Promise<void> | void): void;
}

export interface UserScope {
  readonly tx: Tx;
  readonly ctx: UserContext;
  readonly userId: string;
  afterCommit(callback: () => Promise<void> | void): void;
}

async function runAfterCommit(callbacks: Array<() => Promise<void> | void>): Promise<void> {
  for (const callback of callbacks) {
    try {
      await callback();
    } catch (error) {
      // After-commit work must never undo the committed state; it is retried by its own job.
      console.error(
        "after-commit callback failed",
        error instanceof Error ? error.name : "unknown",
      );
    }
  }
}

/**
 * Runs `fn` in a transaction scoped to `ctx.workspaceId`. Sets `app.workspace_id` locally so
 * PostgreSQL row level security (phase 14) can be added as a second layer.
 */
export async function withWorkspace<T>(
  ctx: WorkspaceContext,
  fn: (scope: WorkspaceScope) => Promise<T>,
): Promise<T> {
  const callbacks: Array<() => Promise<void> | void> = [];
  const result = await ctx.deps.db.transaction(async (tx) => {
    await tx.execute(sql`set local role ep_app`);
    await tx.execute(sql`select set_config('app.workspace_id', ${ctx.workspaceId}, true)`);
    return fn({
      tx,
      ctx,
      workspaceId: ctx.workspaceId,
      afterCommit: (callback) => callbacks.push(callback),
    });
  });
  await runAfterCommit(callbacks);
  return result;
}

/** Runs `fn` in a transaction for user-level actions that are not yet bound to a workspace. */
export async function withUser<T>(
  ctx: UserContext,
  fn: (scope: UserScope) => Promise<T>,
): Promise<T> {
  const callbacks: Array<() => Promise<void> | void> = [];
  const result = await ctx.deps.db.transaction(async (tx) =>
    fn({ tx, ctx, userId: ctx.userId, afterCommit: (callback) => callbacks.push(callback) }),
  );
  await runAfterCommit(callbacks);
  return result;
}
