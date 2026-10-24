/**
 * Auth infrastructure (platform level, not tenant data): lookups by e-mail address and the
 * audit trail of sign-ins and 2FA changes (concept chapter 16).
 */
import { auditLogs, user } from "@ep/db";
import { sql } from "drizzle-orm";
import type { CoreDeps } from "../context";
import { normalizeEmail } from "../crypto-utils";
import { systemContext, withSystem } from "./index";

/** Is 2FA active for the account with this address? Keeps magic links from bypassing it. */
export async function isTwoFactorEnabledForEmail(deps: CoreDeps, email: string): Promise<boolean> {
  return withSystem(systemContext(deps, "auth:two-factor-lookup"), async (tx) => {
    const [row] = await tx
      .select({ twoFactorEnabled: user.twoFactorEnabled })
      .from(user)
      .where(sql`lower(${user.email}) = ${normalizeEmail(email)}`);
    return row?.twoFactorEnabled ?? false;
  });
}

export type AuthAuditAction =
  | "auth.sign_in"
  | "auth.sign_in_magic_link"
  | "auth.sign_in_two_factor"
  | "auth.sign_out"
  | "auth.two_factor_enabled"
  | "auth.two_factor_disabled"
  | "auth.password_changed"
  | "auth.password_reset";

/** Account-level audit entry (no workspace). Never contains passwords, tokens or addresses. */
export async function recordAuthEvent(
  deps: CoreDeps,
  entry: { userId: string; action: AuthAuditAction; ipHash?: string },
): Promise<void> {
  await withSystem(systemContext(deps, "auth:audit"), async (tx) => {
    await tx.insert(auditLogs).values({
      workspaceId: null,
      actorType: "user",
      actorId: entry.userId,
      action: entry.action,
      objectType: "user",
      objectId: entry.userId,
      data: {},
      ipHash: entry.ipHash ?? null,
    });
  });
}
