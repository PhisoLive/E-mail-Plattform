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
