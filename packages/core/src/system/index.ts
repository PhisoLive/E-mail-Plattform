/**
 * systemContext – the single exception to workspace-scoped data access (concept chapter 16):
 * scheduler, sync dispatcher, edge token resolution, platform-wide tables and admin.
 * Only modules listed in `system-imports.test.ts` may import this module.
 */
import type { Tx } from "@ep/db";
import { sql } from "drizzle-orm";
import type { CoreDeps } from "../context";

export interface SystemContext {
  readonly kind: "system";
  readonly deps: CoreDeps;
  /** Why platform-wide access is needed – shows up in logs and admin audits. */
  readonly purpose: string;
}

export function systemContext(deps: CoreDeps, purpose: string): SystemContext {
  return { kind: "system", deps, purpose };
}

/** Transaction with the dedicated database role `ep_system` (BYPASSRLS from phase 14). */
export async function withSystem<T>(ctx: SystemContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return ctx.deps.db.transaction(async (tx) => {
    await tx.execute(sql`set local role ep_system`);
    return fn(tx);
  });
}
