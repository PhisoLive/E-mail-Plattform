import { defaults } from "@ep/config/defaults";
import { invitations, session, verification } from "@ep/db";
import { and, isNotNull, lt, or } from "drizzle-orm";
import type { QueueDefinition, WorkerContext } from "./types";

const day = 86_400_000;

/**
 * Deletion deadlines (concept chapter 17). Phase 0 covers the auth artefacts; every later
 * phase adds its tables here (Fertig-Definition: Löschfrist für neue Tabellen).
 */
export async function runRetention(ctx: WorkerContext): Promise<Record<string, number>> {
  const now = ctx.deps.clock.now();
  const authCutoff = new Date(now.getTime() - defaults.retention.expiredAuthArtifactsDays * day);
  const deleted: Record<string, number> = {};

  const sessions = await ctx.deps.db
    .delete(session)
    .where(lt(session.expiresAt, now))
    .returning({ id: session.id });
  deleted.sessions = sessions.length;
  const verifications = await ctx.deps.db
    .delete(verification)
    .where(lt(verification.expiresAt, now))
    .returning({ id: verification.id });
  deleted.verifications = verifications.length;
  const oldInvitations = await ctx.deps.db
    .delete(invitations)
    .where(
      or(
        lt(invitations.expiresAt, authCutoff),
        and(isNotNull(invitations.revokedAt), lt(invitations.revokedAt, authCutoff)),
        and(isNotNull(invitations.acceptedAt), lt(invitations.acceptedAt, authCutoff)),
      ),
    )
    .returning({ id: invitations.id });
  deleted.invitations = oldInvitations.length;
  return deleted;
}

export const maintenanceQueue: QueueDefinition = {
  queue: "maintenance",
  handlers: {
    retention: async (_job, ctx) => {
      const deleted = await runRetention(ctx);
      ctx.logger.info({ deleted }, "retention finished");
      return deleted;
    },
  },
};
