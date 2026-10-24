import { resolve } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./client";

export const migrationsFolder = resolve(import.meta.dirname, "..", "drizzle");

export async function runMigrations(url: string): Promise<void> {
  const handle = createDatabase(url, { max: 1, applicationName: "emailplattform-migrate" });
  try {
    await migrate(handle.db, { migrationsFolder });
  } finally {
    await handle.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  await runMigrations(url);
  console.info("migrations applied");
}
