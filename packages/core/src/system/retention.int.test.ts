import { invitations, session } from "@ep/db";
import { createTestDeps, createTestUser, createTestWorkspace, TestClock } from "@ep/testing";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { runRetention } from "./retention";

const clock = new TestClock(new Date("2026-11-02T03:00:00Z"));
const deps = createTestDeps(clock);

describe("retention job", () => {
  it("deletes expired sessions and old invitations but keeps current ones", async () => {
    const user = await createTestUser(deps);
    const workspace = await createTestWorkspace(deps);
    const [expired] = await deps.db
      .insert(session)
      .values({
        token: `t-${Math.random()}`,
        userId: user.id,
        expiresAt: new Date("2026-10-01T00:00:00Z"),
      })
      .returning({ id: session.id });
    const [valid] = await deps.db
      .insert(session)
      .values({
        token: `t-${Math.random()}`,
        userId: user.id,
        expiresAt: new Date("2026-12-01T00:00:00Z"),
      })
      .returning({ id: session.id });
    const [oldInvite] = await deps.db
      .insert(invitations)
      .values({
        workspaceId: workspace.id,
        email: "alt@x.de",
        role: "member",
        tokenHash: `h-${Math.random()}`,
        expiresAt: new Date("2026-09-01T00:00:00Z"),
      })
      .returning({ id: invitations.id });
    const [freshInvite] = await deps.db
      .insert(invitations)
      .values({
        workspaceId: workspace.id,
        email: "neu@x.de",
        role: "member",
        tokenHash: `h-${Math.random()}`,
        expiresAt: new Date("2026-11-05T00:00:00Z"),
      })
      .returning({ id: invitations.id });

    await runRetention(deps);

    expect(
      await deps.db
        .select()
        .from(session)
        .where(eq(session.id, expired?.id ?? "")),
    ).toHaveLength(0);
    expect(
      await deps.db
        .select()
        .from(session)
        .where(eq(session.id, valid?.id ?? "")),
    ).toHaveLength(1);
    expect(
      await deps.db
        .select()
        .from(invitations)
        .where(eq(invitations.id, oldInvite?.id ?? "")),
    ).toHaveLength(0);
    expect(
      await deps.db
        .select()
        .from(invitations)
        .where(eq(invitations.id, freshInvite?.id ?? "")),
    ).toHaveLength(1);
  });
});
