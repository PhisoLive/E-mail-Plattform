import { addTestMember, createTestDeps, createTestWorkspace } from "@ep/testing";
import { describe, expect, it } from "vitest";
import { changeMemberRole, listMembers, removeMember } from "./members";

const deps = createTestDeps();

describe("member service", () => {
  it("lists members of the workspace", async () => {
    const workspace = await createTestWorkspace(deps);
    await addTestMember(deps, workspace, "member");
    const result = await listMembers(workspace.ownerCtx);
    expect(result.ok && result.value.map((member) => member.role).sort()).toEqual([
      "member",
      "owner",
    ]);
  });

  it("protects the last owner", async () => {
    const workspace = await createTestWorkspace(deps);
    const members = await listMembers(workspace.ownerCtx);
    if (!members.ok) throw new Error("list failed");
    const ownerMember = members.value[0];
    if (!ownerMember) throw new Error("owner missing");
    expect(
      await changeMemberRole(workspace.ownerCtx, { memberId: ownerMember.id, role: "admin" }),
    ).toEqual({
      ok: false,
      error: { code: "LAST_OWNER" },
    });
    expect(await removeMember(workspace.ownerCtx, ownerMember.id)).toEqual({
      ok: false,
      error: { code: "LAST_OWNER" },
    });
  });

  it("does not let admins touch owners or create owners", async () => {
    const workspace = await createTestWorkspace(deps);
    const admin = await addTestMember(deps, workspace, "admin");
    const member = await addTestMember(deps, workspace, "member");
    const members = await listMembers(workspace.ownerCtx);
    if (!members.ok) throw new Error("list failed");
    const ownerRow = members.value.find((row) => row.role === "owner");
    const memberRow = members.value.find((row) => row.userId === member.user.id);
    if (!ownerRow || !memberRow) throw new Error("rows missing");

    expect(await changeMemberRole(admin.ctx, { memberId: ownerRow.id, role: "member" })).toEqual({
      ok: false,
      error: { code: "OWNER_PROTECTED" },
    });
    expect(await changeMemberRole(admin.ctx, { memberId: memberRow.id, role: "owner" })).toEqual({
      ok: false,
      error: { code: "OWNER_PROTECTED" },
    });
    expect((await changeMemberRole(admin.ctx, { memberId: memberRow.id, role: "viewer" })).ok).toBe(
      true,
    );
    expect(await removeMember(member.ctx, ownerRow.id)).toEqual({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    expect((await removeMember(admin.ctx, memberRow.id)).ok).toBe(true);
  });
});

describe("last owner protection under concurrency", () => {
  it("never leaves a workspace without owner when two owners remove each other at once", async () => {
    const workspace = await createTestWorkspace(deps);
    const second = await addTestMember(deps, workspace, "owner");
    const members = await listMembers(workspace.ownerCtx);
    if (!members.ok) throw new Error("list failed");
    const firstRow = members.value.find((row) => row.userId === workspace.owner.id);
    const secondRow = members.value.find((row) => row.userId === second.user.id);
    if (!firstRow || !secondRow) throw new Error("rows missing");

    const results = await Promise.all([
      removeMember(workspace.ownerCtx, secondRow.id),
      removeMember(second.ctx, firstRow.id),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([
      { ok: false, error: { code: "LAST_OWNER" } },
    ]);
    const after = await listMembers(
      workspace.ownerCtx.role === "owner" && results[0]?.ok ? workspace.ownerCtx : second.ctx,
    );
    expect(after.ok && after.value.filter((row) => row.role === "owner")).toHaveLength(1);
  });

  it("never leaves a workspace without owner when two owners demote each other at once", async () => {
    const workspace = await createTestWorkspace(deps);
    const second = await addTestMember(deps, workspace, "owner");
    const members = await listMembers(workspace.ownerCtx);
    if (!members.ok) throw new Error("list failed");
    const firstRow = members.value.find((row) => row.userId === workspace.owner.id);
    const secondRow = members.value.find((row) => row.userId === second.user.id);
    if (!firstRow || !secondRow) throw new Error("rows missing");

    const results = await Promise.all([
      changeMemberRole(workspace.ownerCtx, { memberId: secondRow.id, role: "member" }),
      changeMemberRole(second.ctx, { memberId: firstRow.id, role: "member" }),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const after = await listMembers(workspace.ownerCtx);
    expect(after.ok && after.value.filter((row) => row.role === "owner")).toHaveLength(1);
  });
});
