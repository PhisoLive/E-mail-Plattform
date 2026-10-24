import { user } from "@ep/db";
import { sql } from "drizzle-orm";
import type { CoreDeps } from "../context";
import { normalizeEmail } from "../crypto-utils";

/**
 * Auth infrastructure lookup (not tenant data): is 2FA active for the account with this
 * address? Used to keep magic links from bypassing the second factor.
 */
export async function isTwoFactorEnabledForEmail(deps: CoreDeps, email: string): Promise<boolean> {
  const [row] = await deps.db
    .select({ twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizeEmail(email)}`);
  return row?.twoFactorEnabled ?? false;
}
