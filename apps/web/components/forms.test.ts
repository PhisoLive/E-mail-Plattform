import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("forms", () => {
  it("never submit with GET – before hydration the input would land in the URL", () => {
    const offenders: string[] = [];
    for (const file of [...sources(join(root, "app")), ...sources(join(root, "components"))]) {
      for (const tag of readFileSync(file, "utf8").match(/<form\b[^>]*>/g) ?? []) {
        if (!/method="post"/.test(tag)) offenders.push(file.slice(root.length + 1));
      }
    }
    expect(offenders).toEqual([]);
  });
});
