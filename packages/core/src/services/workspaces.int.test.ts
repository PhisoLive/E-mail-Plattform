import { auditLogs, senderProfiles, user, workspaceMembers } from "@ep/db";
import { createTestDeps, createTestUser, createTestWorkspace, userContext } from "@ep/testing";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createWorkspace,
  getMembershipRole,
  getUserProfile,
  getWorkspace,
  listMyWorkspaces,
  updateWorkspace,
} from "./workspaces";

const deps = createTestDeps();

describe("workspace service", () => {
  it("creates a workspace with owner, sender profile and audit entry", async () => {
    const owner = await createTestUser(deps);
    const result = await createWorkspace(userContext(deps, owner), {
      name: "Bäckerei Huber",
      country: "AT",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.slug).toMatch(/^baeckerei-huber/);
    expect(result.value.role).toBe("owner");

    const members = await deps.db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, result.value.id));
    expect(members).toEqual([expect.objectContaining({ userId: owner.id, role: "owner" })]);
    const profiles = await deps.db
      .select()
      .from(senderProfiles)
      .where(eq(senderProfiles.workspaceId, result.value.id));
    expect(profiles).toHaveLength(1);
    const audit = await deps.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, result.value.id));
    expect(audit.map((entry) => entry.action)).toContain("workspace.created");
    expect(await getMembershipRole(userContext(deps, owner), result.value.id)).toBe("owner");
  });

  it("derives time zone and language from the country", async () => {
    const workspace = await createTestWorkspace(deps);
    const details = await getWorkspace(workspace.ownerCtx);
    expect(details.ok && details.value.timezone).toBe("Europe/Berlin");
    const owner = await createTestUser(deps);
    const swiss = await createWorkspace(userContext(deps, owner), {
      name: "Zürich AG",
      country: "CH",
    });
    expect(swiss.ok).toBe(true);
    if (!swiss.ok) return;
    const ctx = {
      ...workspace.ownerCtx,
      workspaceId: swiss.value.id,
      actor: { type: "user" as const, id: owner.id },
    };
    const swissDetails = await getWorkspace(ctx);
    expect(swissDetails.ok && swissDetails.value.defaultLanguage).toBe("de-CH");
  });

  it("refuses users without verified e-mail", async () => {
    const owner = await createTestUser(deps);
    const result = await createWorkspace(
      { ...userContext(deps, owner), emailVerified: false },
      { name: "Ohne Bestätigung" },
    );
    expect(result).toEqual({ ok: false, error: { code: "EMAIL_NOT_VERIFIED" } });
  });

  it("lists only the user's own workspaces", async () => {
    const a = await createTestWorkspace(deps, "Firma A");
    const b = await createTestWorkspace(deps, "Firma B");
    const list = await listMyWorkspaces(userContext(deps, a.owner));
    expect(list.map((entry) => entry.id)).toEqual([a.id]);
    expect(list.map((entry) => entry.id)).not.toContain(b.id);
    expect(await getMembershipRole(userContext(deps, a.owner), b.id)).toBeNull();
  });

  it("lets only owners and admins change settings", async () => {
    const workspace = await createTestWorkspace(deps);
    expect((await updateWorkspace(workspace.ownerCtx, { timezone: "Europe/Vienna" })).ok).toBe(
      true,
    );
    expect(await updateWorkspace(workspace.ownerCtx, { timezone: "Mars/Olympus" })).toMatchObject({
      ok: false,
    });
    const memberCtx = { ...workspace.ownerCtx, role: "member" as const };
    expect(await updateWorkspace(memberCtx, { name: "Neu" })).toEqual({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
  });

  it("reads the platform role and 2FA state fresh from the database", async () => {
    const someone = await createTestUser(deps, { twoFactorEnabled: false });
    const ctx = userContext(deps, someone);
    expect(await getUserProfile(ctx)).toMatchObject({
      platformRole: "user",
      twoFactorEnabled: false,
    });
    await deps.db
      .update(user)
      .set({ platformRole: "platform_admin", twoFactorEnabled: true })
      .where(eq(user.id, someone.id));
    expect(await getUserProfile(ctx)).toMatchObject({
      platformRole: "platform_admin",
      twoFactorEnabled: true,
    });
  });
});
