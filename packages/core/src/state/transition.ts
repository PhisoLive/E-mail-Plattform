import {
  approvals,
  campaignRecipients,
  campaigns,
  entityEvents,
  mailboxes,
  messageEvents,
  messages,
  tasks,
} from "@ep/db";
import { and, eq } from "drizzle-orm";
import { appError } from "../errors";
import type { LiveEventType, LiveValue } from "../live/publisher";
import { err, ok, type Result } from "../result";
import type { WorkspaceScope } from "../scope";
import { canTransition, type EntityKind, type EntityState } from "./machines";

const tables = {
  message: messages,
  campaign: campaigns,
  recipient: campaignRecipients,
  mailbox: mailboxes,
  approval: approvals,
  task: tasks,
} as const;

type Tables = typeof tables;
export type EntityUpdate<E extends EntityKind> = Partial<
  Omit<Tables[E]["$inferInsert"], "id" | "workspaceId" | "status">
>;

const liveTypes: Record<EntityKind, LiveEventType> = {
  message: "message.updated",
  campaign: "campaign.progress",
  recipient: "campaign.progress",
  mailbox: "mailbox.status",
  approval: "approval.created",
  task: "task.created",
};

export interface TransitionOptions<E extends EntityKind> {
  /** Additional columns written together with the status (e.g. `sentAt`). */
  set?: EntityUpdate<E>;
  /** Extra event data – ids and codes only, never contents. */
  data?: Record<string, LiveValue>;
}

export interface TransitionResult<E extends EntityKind> {
  from: EntityState<E>;
  to: EntityState<E>;
}

/**
 * The only way to change the status of a message, campaign, recipient, mailbox, approval or
 * task (concept chapter 4, CLAUDE.md rule 5). Locks the row, checks the expected source state
 * and the state machine, writes the new status, an event and – after commit – a live message.
 */
export async function transition<E extends EntityKind>(
  scope: WorkspaceScope,
  entity: E,
  id: string,
  from: EntityState<E> | readonly EntityState<E>[],
  to: EntityState<E>,
  reason: string,
  options: TransitionOptions<E> = {},
): Promise<Result<TransitionResult<E>>> {
  // All entity tables share `id`, `workspace_id`, `status` and `updated_at`; the cast only
  // unifies their types for the query builder – the real table object is used at runtime.
  const table = tables[entity] as unknown as typeof tasks;
  const expected = (Array.isArray(from) ? from : [from]) as readonly string[];
  for (const source of expected) {
    if (!canTransition(entity, source as EntityState<E>, to)) {
      return err(appError("INVALID_TRANSITION", { entity, from: source, to }));
    }
  }

  const [row] = await scope.tx
    .select({ status: table.status })
    .from(table)
    .where(and(eq(table.workspaceId, scope.workspaceId), eq(table.id, id)))
    .for("update");
  if (!row) return err(appError("NOT_FOUND"));
  const current = row.status as EntityState<E>;
  if (!expected.includes(current)) {
    return err(
      appError("STATE_CHANGED", { entity, expected: expected.join(","), actual: current }),
    );
  }

  await scope.tx
    .update(table)
    .set({ ...(options.set ?? {}), status: to, updatedAt: new Date() } as never)
    .where(and(eq(table.workspaceId, scope.workspaceId), eq(table.id, id)));

  const actor = scope.ctx.actor;
  if (entity === "message") {
    await scope.tx.insert(messageEvents).values({
      workspaceId: scope.workspaceId,
      messageId: id,
      type: to,
      data: { from: current, reason, ...(options.data ?? {}) },
    });
  } else {
    await scope.tx.insert(entityEvents).values({
      workspaceId: scope.workspaceId,
      entityType: entity,
      entityId: id,
      fromStatus: current,
      toStatus: to,
      reason,
      actorType: actor.type,
      actorId: actor.id,
      data: options.data ?? {},
    });
  }

  scope.afterCommit(() =>
    scope.ctx.deps.live.publish(scope.workspaceId, {
      type: liveTypes[entity],
      id,
      status: to,
      data: { entity, from: current, ...(options.data ?? {}) },
    }),
  );
  return ok({ from: current, to });
}

/** Records the initial state of a newly created entity (event + live message). */
export async function recordCreated(
  scope: WorkspaceScope,
  entity: EntityKind,
  id: string,
  status: string,
  data: Record<string, LiveValue> = {},
): Promise<void> {
  if (entity === "message") {
    await scope.tx.insert(messageEvents).values({
      workspaceId: scope.workspaceId,
      messageId: id,
      type: "created",
      data: { status, ...data },
    });
  } else {
    await scope.tx.insert(entityEvents).values({
      workspaceId: scope.workspaceId,
      entityType: entity,
      entityId: id,
      fromStatus: null,
      toStatus: status,
      reason: "created",
      actorType: scope.ctx.actor.type,
      actorId: scope.ctx.actor.id,
      data,
    });
  }
  scope.afterCommit(() =>
    scope.ctx.deps.live.publish(scope.workspaceId, {
      type: liveTypes[entity],
      id,
      status,
      data: { entity, ...data },
    }),
  );
}
