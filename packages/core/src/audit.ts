import { auditLogs } from "@ep/db";
import type { Actor } from "./context";
import type { UserScope, WorkspaceScope } from "./scope";

export interface AuditEntry {
  action: string;
  objectType?: string;
  objectId?: string;
  /** Never secrets, passwords, tokens or mail contents. */
  data?: Record<string, unknown>;
}

/** Appends an audit log entry inside the current transaction. Append-only. */
export async function writeAudit(scope: WorkspaceScope, entry: AuditEntry): Promise<void> {
  await insertAudit(scope.tx, scope.workspaceId, scope.ctx.actor, scope.ctx.ipHash, entry);
}

export async function writeUserAudit(
  scope: UserScope,
  workspaceId: string | null,
  entry: AuditEntry,
): Promise<void> {
  await insertAudit(
    scope.tx,
    workspaceId,
    { type: "user", id: scope.userId },
    scope.ctx.ipHash,
    entry,
  );
}

async function insertAudit(
  tx: WorkspaceScope["tx"],
  workspaceId: string | null,
  actor: Actor,
  ipHash: string | undefined,
  entry: AuditEntry,
): Promise<void> {
  await tx.insert(auditLogs).values({
    workspaceId,
    actorType: actor.type,
    actorId: actor.id,
    action: entry.action,
    objectType: entry.objectType ?? null,
    objectId: entry.objectId ?? null,
    data: entry.data ?? {},
    ipHash: ipHash ?? null,
  });
}
