import { createTestDeps, createTestUser, createTestWorkspace, userContext } from "@ep/testing";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { withUser, withWorkspace } from "./scope";
import { systemContext, withSystem } from "./system";

const deps = createTestDeps();

async function currentRole(tx: { execute: (query: ReturnType<typeof sql>) => Promise<unknown> }) {
  const rows = (await tx.execute(sql`select current_user as role`)) as unknown as Array<{
    role: string;
  }>;
  return rows[0]?.role;
}

describe("database roles of the scope helpers (ENTSCHEIDUNGEN E-028)", () => {
  it("withWorkspace and withUser run as ep_app, withSystem as ep_system", async () => {
    const workspace = await createTestWorkspace(deps);
    const user = await createTestUser(deps);
    expect(await withWorkspace(workspace.ownerCtx, (scope) => currentRole(scope.tx))).toBe(
      "ep_app",
    );
    expect(await withUser(userContext(deps, user), (scope) => currentRole(scope.tx))).toBe(
      "ep_app",
    );
    expect(await withSystem(systemContext(deps, "test:roles"), (tx) => currentRole(tx))).toBe(
      "ep_system",
    );
  });

  it("sets the scope variables only for the transaction", async () => {
    const workspace = await createTestWorkspace(deps);
    const inside = await withWorkspace(workspace.ownerCtx, async (scope) => {
      const rows = (await scope.tx.execute(
        sql`select current_setting('app.workspace_id', true) as id`,
      )) as unknown as Array<{ id: string }>;
      return rows[0]?.id;
    });
    expect(inside).toBe(workspace.id);
    const user = await createTestUser(deps);
    const userInside = await withUser(userContext(deps, user), async (scope) => {
      const rows = (await scope.tx.execute(
        sql`select current_setting('app.user_id', true) as id`,
      )) as unknown as Array<{ id: string }>;
      return rows[0]?.id;
    });
    expect(userInside).toBe(user.id);
  });
});
