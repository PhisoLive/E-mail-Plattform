import { invitations, workspaceMembers } from "@ep/db";
import {
  addTestMember,
  createTestDeps,
  createTestUser,
  createTestWorkspace,
  TestClock,
  userContext,
} from "@ep/testing";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  acceptInvitation,
  createInvitation,
  listInvitations,
  previewInvitation,
  revokeInvitation,
} from "./invitations";

const clock = new TestClock(new Date("2026-10-26T09:00:00Z"));
const deps = createTestDeps(clock);

describe("invitation service", () => {
  it("stores only the token hash and lets the invited user join", async () => {
    const workspace = await createTestWorkspace(deps);
    const invitee = await createTestUser(deps);
    const created = await createInvitation(workspace.ownerCtx, {
      email: invitee.email.toUpperCase(),
      role: "member",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    // The expiry date in the mail follows the time zone of the workspace.
    expect(created.value.workspaceTimezone).toBe("Europe/Berlin");

    const [row] = await deps.db
      .select()
      .from(invitations)
      .where(eq(invitations.id, created.value.id));
    expect(row?.tokenHash).not.toContain(created.value.token);
    expect(JSON.stringify(row)).not.toContain(created.value.token);
    expect(row?.email).toBe(invitee.email.toLowerCase());

    const preview = await previewInvitation(deps, created.value.token);
    expect(preview).toMatchObject({ ok: true, value: { state: "valid", role: "member" } });

    const accepted = await acceptInvitation(userContext(deps, invitee), created.value.token);
    expect(accepted).toEqual({ ok: true, value: { workspaceId: workspace.id } });
    const membership = await deps.db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(workspaceMembers.userId, invitee.id),
        ),
      );
    expect(membership[0]?.role).toBe("member");

    // A token works only once.
    expect(await acceptInvitation(userContext(deps, invitee), created.value.token)).toEqual({
      ok: false,
      error: { code: "INVITATION_INVALID" },
    });
  });

  it("rejects other e-mail addresses, expired and revoked invitations", async () => {
    const workspace = await createTestWorkspace(deps);
    const invitee = await createTestUser(deps);
    const stranger = await createTestUser(deps);
    const created = await createInvitation(workspace.ownerCtx, {
      email: invitee.email,
      role: "viewer",
    });
    if (!created.ok) throw new Error("create failed");
    expect(await acceptInvitation(userContext(deps, stranger), created.value.token)).toEqual({
      ok: false,
      error: { code: "INVITATION_EMAIL_MISMATCH" },
    });

    clock.advance(8 * 86_400_000);
    expect(await acceptInvitation(userContext(deps, invitee), created.value.token)).toEqual({
      ok: false,
      error: { code: "INVITATION_EXPIRED" },
    });
    clock.advance(-8 * 86_400_000);

    const second = await createInvitation(workspace.ownerCtx, {
      email: invitee.email,
      role: "viewer",
    });
    if (!second.ok) throw new Error("create failed");
    // The first invitation was revoked by the second one.
    expect(await previewInvitation(deps, created.value.token)).toEqual({
      ok: false,
      error: { code: "INVITATION_INVALID" },
    });
    expect((await revokeInvitation(workspace.ownerCtx, second.value.id)).ok).toBe(true);
    expect(await acceptInvitation(userContext(deps, invitee), second.value.token)).toEqual({
      ok: false,
      error: { code: "INVITATION_INVALID" },
    });
    expect(await previewInvitation(deps, "x".repeat(43))).toEqual({
      ok: false,
      error: { code: "INVITATION_INVALID" },
    });
  });

  it("enforces team rights", async () => {
    const workspace = await createTestWorkspace(deps);
    const admin = await addTestMember(deps, workspace, "admin");
    const member = await addTestMember(deps, workspace, "member");
    expect(
      await createInvitation(member.ctx, { email: "neu@beispiel.test", role: "viewer" }),
    ).toEqual({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    expect(
      await createInvitation(admin.ctx, { email: "neu@beispiel.test", role: "owner" }),
    ).toEqual({
      ok: false,
      error: { code: "OWNER_PROTECTED" },
    });
    expect(await createInvitation(admin.ctx, { email: member.user.email, role: "viewer" })).toEqual(
      {
        ok: false,
        error: { code: "ALREADY_MEMBER" },
      },
    );
    const ok = await createInvitation(admin.ctx, { email: "neu@beispiel.test", role: "admin" });
    expect(ok.ok).toBe(true);
    const list = await listInvitations(workspace.ownerCtx);
    expect(list.ok && list.value.map((entry) => entry.email)).toEqual(["neu@beispiel.test"]);
  });
});

describe("invitation protections", () => {
  it("does not let admins revoke or replace owner invitations", async () => {
    const workspace = await createTestWorkspace(deps);
    const admin = await addTestMember(deps, workspace, "admin");
    const ownerInvite = await createInvitation(workspace.ownerCtx, {
      email: "cfo@beispiel.test",
      role: "owner",
    });
    if (!ownerInvite.ok) throw new Error("create failed");
    expect(await revokeInvitation(admin.ctx, ownerInvite.value.id)).toEqual({
      ok: false,
      error: { code: "OWNER_PROTECTED" },
    });
    expect(
      await createInvitation(admin.ctx, { email: "cfo@beispiel.test", role: "viewer" }),
    ).toEqual({
      ok: false,
      error: { code: "OWNER_PROTECTED" },
    });
    expect(await previewInvitation(deps, ownerInvite.value.token)).toMatchObject({
      ok: true,
      value: { role: "owner", state: "valid" },
    });
    expect((await revokeInvitation(workspace.ownerCtx, ownerInvite.value.id)).ok).toBe(true);
  });

  it("limits invitation mails per workspace and day", async () => {
    const workspace = await createTestWorkspace(deps);
    for (let index = 0; index < 50; index++) {
      const result = await createInvitation(workspace.ownerCtx, {
        email: `person${index}@beispiel.test`,
        role: "viewer",
      });
      expect(result.ok).toBe(true);
    }
    expect(
      await createInvitation(workspace.ownerCtx, {
        email: "eine-zu-viel@beispiel.test",
        role: "viewer",
      }),
    ).toEqual({
      ok: false,
      error: { code: "RATE_LIMITED" },
    });
  });
});
