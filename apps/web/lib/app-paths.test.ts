import { describe, expect, it } from "vitest";
import { isWorkspacePage, matchesPrefix } from "./app-paths";

describe("app paths", () => {
  it("tells workspace pages from the website and recipient pages", () => {
    expect(isWorkspacePage("/start")).toBe(true);
    expect(isWorkspacePage("/einstellungen/team")).toBe(true);
    expect(isWorkspacePage("/admin/system")).toBe(true);
    expect(isWorkspacePage("/")).toBe(false);
    expect(isWorkspacePage("/login")).toBe(false);
    expect(isWorkspacePage("/u/abc")).toBe(false);
    expect(isWorkspacePage("/startseite")).toBe(false);
    expect(matchesPrefix("/adminx", "/admin")).toBe(false);
  });
});
