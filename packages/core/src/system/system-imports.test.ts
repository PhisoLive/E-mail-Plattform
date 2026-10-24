import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Only these modules may use systemContext (concept chapter 16): scheduler, sync dispatcher,
 * edge token resolution, platform-wide tables and admin. Extend deliberately.
 */
const allowed = new Set([
  "packages/core/src/system/index.ts",
  "packages/core/src/system/operations.ts",
  "packages/core/src/services/invitations.ts",
]);

const root = resolve(import.meta.dirname, "..", "..", "..", "..");
const scanRoots = ["packages", "apps"];
const importPattern =
  /from\s+["'](?:@ep\/core\/system|(?:\.\.?\/)+(?:[\w-]+\/)*system(?:\/index)?)["']/;

function walk(dir: string, files: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "dist" || entry.startsWith("."))
      continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) files.push(full);
  }
}

describe("systemContext imports", () => {
  it("are limited to the allowed modules", () => {
    const files: string[] = [];
    for (const scan of scanRoots) walk(join(root, scan), files);
    const offenders = files
      .filter((file) => importPattern.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file))
      .filter((file) => !allowed.has(file));
    expect(offenders).toEqual([]);
  });
});
