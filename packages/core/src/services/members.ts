import { user, workspaceMembers } from "@ep/db";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../audit";
import type { MemberRole, WorkspaceContext } from "../context";
import { appError } from "../errors";
import { canManageRole, requirePermission } from "../permissions";
import { err, ok, type Result } from "../result";
import { type WorkspaceScope, withWorkspace } from "../scope";

export interface MemberView {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export async function listMembers(ctx: WorkspaceContext): Promise<Result<MemberView[]>> {
  const permission = requirePermission(ctx.role, "workspace.view");
  if (!permission.ok) return permission;
  return withWorkspace(ctx, async (scope) => {
    const rows = await scope.tx
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        name: user.name,
        email: user.email,
        role: workspaceMembers.role,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: workspaceMembers.createdAt,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(user.id, workspaceMembers.userId))
      .where(eq(workspaceMembers.workspaceId, scope.workspaceId))
      .orderBy(asc(workspaceMembers.createdAt));
    return ok(rows.map((row) => ({ ...row, twoFactorEnabled: row.twoFactorEnabled ?? false })));
  });
}

async function loadMember(scope: WorkspaceScope, memberId: string) {
  const [member] = await scope.tx
    .select()
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, scope.workspaceId), eq(workspaceMembers.id, memberId)),
    )
    .for("update");
  return member;
}

/**
 * Locks all owner rows (always before any other member row, in a fixed order) and returns their
 * number. Two owners demoting or removing each other at the same time are serialized, so the
 * second one sees the result of the first ("letzter Inhaber" stays protected).
 */
async function lockOwners(scope: WorkspaceScope): Promise<number> {
  const owners = await scope.tx
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, scope.workspaceId), eq(workspaceMembers.role, "owner")),
    )
    .orderBy(asc(workspaceMembers.id))
    .for("update");
  return owners.length;
}

export const changeRoleInput = z.object({
  memberId: z.uuid(),
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export async function changeMemberRole(
  ctx: WorkspaceContext,
  rawInput: z.input<typeof changeRoleInput>,
): Promise<Result<true>> {
  const permission = requirePermission(ctx.role, "team.manage");
  if (!permission.ok) return permission;
  const parsed = changeRoleInput.safeParse(rawInput);
  if (!parsed.success) return err(appError("VALIDATION"));
  const { memberId, role } = parsed.data;

  return withWorkspace(ctx, async (scope) => {
    const owners = await lockOwners(scope);
    const member = await loadMember(scope, memberId);
    if (!member) return err(appError("NOT_FOUND"));
    if (!canManageRole(ctx.role, member.role, role)) return err(appError("OWNER_PROTECTED"));
    if (member.role === "owner" && role !== "owner" && owners <= 1) {
      return err(appError("LAST_OWNER"));
    }
    await scope.tx
      .update(workspaceMembers)
      .set({ role })
      .where(
        and(eq(workspaceMembers.workspaceId, scope.workspaceId), eq(workspaceMembers.id, memberId)),
      );
    await writeAudit(scope, {
      action: "member.role_changed",
      objectType: "workspace_member",
      objectId: memberId,
      data: { from: member.role, to: role },
    });
    return ok(true as const);
  });
}

export async function removeMember(ctx: WorkspaceContext, memberId: string): Promise<Result<true>> {
  const permission = requirePermission(ctx.role, "team.manage");
  if (!permission.ok) return permission;
  if (!z.uuid().safeParse(memberId).success) return err(appError("VALIDATION"));

  return withWorkspace(ctx, async (scope) => {
    const owners = await lockOwners(scope);
    const member = await loadMember(scope, memberId);
    if (!member) return err(appError("NOT_FOUND"));
    if (!canManageRole(ctx.role, member.role)) return err(appError("OWNER_PROTECTED"));
    if (member.role === "owner" && owners <= 1) return err(appError("LAST_OWNER"));
    await scope.tx
      .delete(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, scope.workspaceId), eq(workspaceMembers.id, memberId)),
      );
    await writeAudit(scope, {
      action: "member.removed",
      objectType: "workspace_member",
      objectId: memberId,
      data: { role: member.role },
    });
    return ok(true as const);
  });
}
