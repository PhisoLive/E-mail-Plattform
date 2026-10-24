/**
 * Deletion deadlines (concept chapter 17), platform-wide by nature → systemContext.
 * Phase 0 covers the auth artefacts; every later phase adds its tables here
 * (Fertig-Definition: Löschfrist für neue Tabellen mit personenbezogenen Daten).
 */
import { defaults } from "@ep/config/defaults";
import { invitations, session, verification } from "@ep/db";
import { and, isNotNull, lt, or } from "drizzle-orm";
import type { CoreDeps } from "../context";
import { systemContext, withSystem } from "./index";

const day = 86_400_000;

export async function runRetention(deps: CoreDeps): Promise<Record<string, number>> {
  const now = deps.clock.now();
  const authCutoff = new Date(now.getTime() - defaults.retention.expiredAuthArtifactsDays * day);
  return withSystem(systemContext(deps, "maintenance:retention"), async (tx) => {
    const deleted: Record<string, number> = {};
    deleted.sessions = (
      await tx.delete(session).where(lt(session.expiresAt, now)).returning({ id: session.id })
    ).length;
    deleted.verifications = (
      await tx
        .delete(verification)
        .where(lt(verification.expiresAt, now))
        .returning({ id: verification.id })
    ).length;
    deleted.invitations = (
      await tx
        .delete(invitations)
        .where(
          or(
            lt(invitations.expiresAt, authCutoff),
            and(isNotNull(invitations.revokedAt), lt(invitations.revokedAt, authCutoff)),
            and(isNotNull(invitations.acceptedAt), lt(invitations.acceptedAt, authCutoff)),
          ),
        )
        .returning({ id: invitations.id })
    ).length;
    return deleted;
  });
}
