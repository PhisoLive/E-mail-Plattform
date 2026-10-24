import { createTestDeps } from "@ep/testing";
import { describe, expect, it } from "vitest";
import { createEdgeApp } from "./app";

describe("edge app", () => {
  it("reports health and sets security headers", async () => {
    const app = createEdgeApp(createTestDeps());
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", checks: { database: "ok" } });
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });
});
