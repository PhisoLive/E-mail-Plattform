import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards for tenant isolation (concept chapter 16, CLAUDE.md rule 4):
 * 1. Only these modules may use systemContext: scheduler, sync dispatcher, edge token
 *    resolution, platform-wide tables, admin and ops. Extend deliberately.
 * 2. Raw database handles (`deps.db`, `createDatabase`) are only used in the scope helpers,
 *    the system module and infrastructure – everything else goes through withWorkspace/withUser.
 */
const systemImportAllowed = [
  /^packages\/core\/src\/system\//,
  /^packages\/core\/src\/services\/invitations\.ts$/,
  /^apps\/web\/server\/auth\.ts$/,
  /^apps\/worker\/src\/queues\/maintenance\.ts$/,
  /^scripts\/ops\.ts$/,
];

const rawDbAllowed = [
  /^packages\/core\/src\/scope\.ts$/,
  /^packages\/core\/src\/system\//,
  /^packages\/core\/src\/health\.ts$/,
  /^packages\/core\/src\/runtime\.ts$/,
  /^packages\/db\//,
  /^packages\/testing\//,
  // Better Auth needs the Drizzle instance for its own tables (ENTSCHEIDUNGEN E-005).
  /^apps\/web\/server\/auth\.ts$/,
];

const root = resolve(import.meta.dirname, "..", "..", "..", "..");
const scanRoots = ["packages", "apps", "scripts", "e2e"];

const systemImport =
  /(?:from\s*|import\s*\(\s*|require\s*\(\s*)["'](?:@ep\/core\/system(?:\/[\w.-]+)?|(?:\.\.?\/)+(?:[\w-]+\/)*system(?:\/[\w.-]+)?)["']/;
const rawDb =
  /\b(?:deps|core\.deps|ctx\.deps|runtime\.deps|this\.deps)\s*\.\s*db\b|\bcreateDatabase\s*\(/;

function walk(dir: string, files: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (
      entry === "node_modules" ||
      entry.startsWith(".next") ||
      entry === "dist" ||
      entry.startsWith(".")
    )
      continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|mts|mjs)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) files.push(full);
  }
}

function sourceFiles(): Array<{ path: string; text: string }> {
  const files: string[] = [];
  for (const scan of scanRoots) walk(join(root, scan), files);
  return files.map((file) => ({ path: relative(root, file), text: readFileSync(file, "utf8") }));
}

describe("tenant isolation guards", () => {
  it("only allowed modules import systemContext", () => {
    const offenders = sourceFiles()
      .filter((file) => systemImport.test(file.text))
      .map((file) => file.path)
      .filter((path) => !systemImportAllowed.some((pattern) => pattern.test(path)));
    expect(offenders).toEqual([]);
  });

  it("only the scope helpers, the system module and infrastructure touch the raw database", () => {
    const offenders = sourceFiles()
      .filter((file) => rawDb.test(file.text))
      .map((file) => file.path)
      .filter((path) => !rawDbAllowed.some((pattern) => pattern.test(path)));
    expect(offenders).toEqual([]);
  });

  it("detects the import variants it is meant to catch", () => {
    for (const specifier of [
      'from "@ep/core/system"',
      'from "@ep/core/system/operations"',
      'from "@ep/core/system/index"',
      'from "../system/operations"',
      'from "./system"',
      'await import("@ep/core/system/retention")',
    ]) {
      expect(systemImport.test(specifier)).toBe(true);
    }
    expect(systemImport.test('from "@ep/core/systematic"')).toBe(false);
    expect(rawDb.test("await ctx.deps.db.select()")).toBe(true);
    expect(rawDb.test("createDatabase(url)")).toBe(true);
  });
});
