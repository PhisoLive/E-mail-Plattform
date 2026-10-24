import { runMigrations } from "@ep/db/migrate";
import postgres from "postgres";
import { testUrls } from "./env";

/** Drops and recreates a database on the test stack, then applies all migrations. */
export async function recreateDatabase(name: string): Promise<string> {
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`invalid database name ${name}`);
  const admin = postgres(testUrls.adminDatabase, { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.unsafe(`CREATE DATABASE ${name}`);
  } finally {
    await admin.end({ timeout: 5 });
  }
  const url = testUrls.database(name);
  await runMigrations(url);
  return url;
}
