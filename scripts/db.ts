import { runMigrations } from "@ep/db/migrate";
import { loadRootEnv, requireEnv } from "./lib/env";

loadRootEnv();
const [command] = process.argv.slice(2);

if (command === "migrate") {
  await runMigrations(requireEnv("DATABASE_URL"));
  console.info("migrations applied");
} else if (command === "seed") {
  const { runSeed } = await import("@ep/db/seed");
  await runSeed(requireEnv("DATABASE_URL"));
} else {
  throw new Error(`unknown command ${command}`);
}
