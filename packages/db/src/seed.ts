import { sql } from "drizzle-orm";
import { createDatabase } from "./client";
import { plans } from "./schema/billing";

/**
 * Idempotent seed data. Plans are placeholders – names and numbers come with the price
 * decision (concept chapter 14); nothing here is hard-wired in code.
 */
export async function runSeed(url: string): Promise<void> {
  const handle = createDatabase(url, { max: 1, applicationName: "emailplattform-seed" });
  try {
    await handle.db
      .insert(plans)
      .values({
        code: "beta",
        name: "Beta",
        limits: {
          mailboxes: 10,
          emailsPerMonth: 20_000,
          aiBudgetCents: 5_000,
          agents: 5,
          seats: 5,
          inboxTestsPerMonth: 20,
          contacts: 100_000,
          features: [],
        },
      })
      .onConflictDoUpdate({ target: plans.code, set: { updatedAt: sql`now()` } });
    console.info("seed applied");
  } finally {
    await handle.close();
  }
}
