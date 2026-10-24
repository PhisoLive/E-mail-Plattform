import { recreateDatabase } from "./database";
import { testDatabaseName } from "./env";
import { infraUp } from "./infra/compose";

/**
 * Vitest global setup: starts the test stack (Postgres 18, Valkey, GreenMail, Mailpit, Rspamd
 * on 127.0.0.1 only) and creates a fresh, migrated test database.
 */
export default async function setup(): Promise<void> {
  if (process.env.SKIP_TEST_INFRA === "1") return;
  await infraUp("test");
  process.env.TEST_DATABASE_URL = await recreateDatabase(testDatabaseName);
}
