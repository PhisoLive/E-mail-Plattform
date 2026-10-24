/**
 * Operations commands (CLAUDE.md: `pnpm ops:rebuild-queues`, concept chapter 14:
 * `pnpm ops:set-trust`). Platform-wide by nature, therefore in the system module.
 */
import { auditLogs, messages, workspaces } from "@ep/db";
import { eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import type { CoreDeps } from "../context";
import { workspaceContext } from "../context";
import { jobIds } from "../jobs/queue";
import { withWorkspace } from "../scope";
import { transition } from "../state/transition";
import { systemContext, withSystem } from "./index";

export interface RebuildReport {
  requeued: number;
  markedUncertain: number;
}

/**
 * Rebuilds the queues from Postgres (the truth): messages in `queued` get their send job
 * again (same job id – idempotent); messages stuck in `sending` become `uncertain` instead of
 * being sent again (never send twice, concept chapter 9).
 */
export async function rebuildQueues(deps: CoreDeps): Promise<RebuildReport> {
  const rows = await withSystem(systemContext(deps, "ops:rebuild-queues"), (tx) =>
    tx
      .select({
        id: messages.id,
        workspaceId: messages.workspaceId,
        status: messages.status,
        attemptCount: messages.attemptCount,
      })
      .from(messages)
      .where(inArray(messages.status, ["queued", "sending"])),
  );
  const report: RebuildReport = { requeued: 0, markedUncertain: 0 };
  for (const row of rows) {
    const ctx = workspaceContext(
      deps,
      row.workspaceId,
      { type: "system", id: "ops:rebuild-queues" },
      "owner",
    );
    if (row.status === "sending") {
      const result = await withWorkspace(ctx, (scope) =>
        transition(scope, "message", row.id, "sending", "uncertain", "rebuild_queues"),
      );
      if (result.ok) report.markedUncertain++;
    } else {
      await deps.queue.enqueue(
        "send",
        "send",
        { workspaceId: row.workspaceId, messageId: row.id, attempt: row.attemptCount },
        { jobId: jobIds.send(row.id, row.attemptCount) },
      );
      report.requeued++;
    }
  }
  return report;
}

export const trustLevels = ["new", "verified", "established", "restricted"] as const;
export type TrustLevel = (typeof trustLevels)[number];

/** Sets the trust level of a workspace (admin approval in the beta, concept chapter 14). */
export async function setTrustLevel(
  deps: CoreDeps,
  workspaceIdOrSlug: string,
  level: TrustLevel,
  reason: string,
): Promise<{ workspaceId: string; from: string; to: TrustLevel }> {
  if (!trustLevels.includes(level)) throw new Error(`unknown trust level ${level}`);
  if (reason.trim().length < 3) throw new Error("a reason is required");
  return withSystem(systemContext(deps, "ops:set-trust"), async (tx) => {
    const byId = z.uuid().safeParse(workspaceIdOrSlug).success;
    const [workspace] = await tx
      .select({ id: workspaces.id, trustLevel: workspaces.trustLevel })
      .from(workspaces)
      .where(
        byId
          ? or(eq(workspaces.id, workspaceIdOrSlug), eq(workspaces.slug, workspaceIdOrSlug))
          : eq(workspaces.slug, workspaceIdOrSlug),
      );
    if (!workspace) throw new Error(`workspace ${workspaceIdOrSlug} not found`);
    await tx.update(workspaces).set({ trustLevel: level }).where(eq(workspaces.id, workspace.id));
    await tx.insert(auditLogs).values({
      workspaceId: workspace.id,
      actorType: "system",
      actorId: "ops:set-trust",
      action: "trust.set",
      objectType: "workspace",
      objectId: workspace.id,
      data: { from: workspace.trustLevel, to: level, reason },
    });
    return { workspaceId: workspace.id, from: workspace.trustLevel, to: level };
  });
}
