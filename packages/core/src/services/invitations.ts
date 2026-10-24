import { defaults } from "@ep/config/defaults";
import { invitations, user, workspaceMembers, workspaces } from "@ep/db";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { writeAudit, writeUserAudit } from "../audit";
import type { CoreDeps, MemberRole, UserContext, WorkspaceContext } from "../context";
import { normalizeEmail, randomToken, sha256Hex } from "../crypto-utils";
import { appError } from "../errors";
import { canManageRole, requirePermission } from "../permissions";
import { err, ok, type Result } from "../result";
import { withUser, withWorkspace } from "../scope";
import { systemContext, withSystem } from "../system/index";

export const createInvitationInput = z.object({
  email: z.email().max(254),
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export interface CreatedInvitation {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: Date;
  /** Plain token – only returned once to send the invitation mail, never stored. */
  token: string;
  workspaceName: string;
}

export async function createInvitation(
  ctx: WorkspaceContext,
  rawInput: z.input<typeof createInvitationInput>,
): Promise<Result<CreatedInvitation>> {
  const permission = requirePermission(ctx.role, "team.manage");
  if (!permission.ok) return permission;
  const parsed = createInvitationInput.safeParse(rawInput);
  if (!parsed.success) return err(appError("VALIDATION", undefined, { email: "invalid" }));
  const email = normalizeEmail(parsed.data.email);
  const role = parsed.data.role;
  if (!canManageRole(ctx.role, "viewer", role)) return err(appError("OWNER_PROTECTED"));

  return withWorkspace(ctx, async (scope) => {
    const existingMember = await scope.tx
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .innerJoin(user, eq(user.id, workspaceMembers.userId))
      .where(
        and(
          eq(workspaceMembers.workspaceId, scope.workspaceId),
          sql`lower(${user.email}) = ${email}`,
        ),
      );
    if (existingMember.length > 0) return err(appError("ALREADY_MEMBER"));

    const since = new Date(ctx.deps.clock.now().getTime() - 86_400_000);
    const [recent] = await scope.tx
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(and(eq(invitations.workspaceId, scope.workspaceId), gt(invitations.createdAt, since)));
    if ((recent?.count ?? 0) >= defaults.invitation.maxPerWorkspacePerDay) {
      return err(appError("RATE_LIMITED"));
    }

    const open = await scope.tx
      .select({ role: invitations.role })
      .from(invitations)
      .where(
        and(
          eq(invitations.workspaceId, scope.workspaceId),
          eq(invitations.email, email),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .for("update");
    // Replacing an open invitation counts as revoking it: admins never touch owner invitations.
    if (open.some((existing) => !canManageRole(ctx.role, existing.role))) {
      return err(appError("OWNER_PROTECTED"));
    }

    // Only one open invitation per address: older ones are revoked.
    await scope.tx
      .update(invitations)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(invitations.workspaceId, scope.workspaceId),
          eq(invitations.email, email),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      );

    const token = randomToken(32);
    const expiresAt = new Date(
      ctx.deps.clock.now().getTime() + defaults.invitation.expiresDays * 86_400_000,
    );
    const [invitation] = await scope.tx
      .insert(invitations)
      .values({
        workspaceId: scope.workspaceId,
        email,
        role,
        tokenHash: sha256Hex(token),
        expiresAt,
        createdAt: ctx.deps.clock.now(),
        invitedBy: ctx.actor.type === "user" ? ctx.actor.id : null,
      })
      .returning({ id: invitations.id });
    const [workspace] = await scope.tx
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, scope.workspaceId));
    if (!invitation || !workspace) return err(appError("INTERNAL"));
    await writeAudit(scope, {
      action: "invitation.created",
      objectType: "invitation",
      objectId: invitation.id,
      data: { role },
    });
    return ok({ id: invitation.id, email, role, expiresAt, token, workspaceName: workspace.name });
  });
}

export interface InvitationView {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: Date;
  createdAt: Date;
}

export async function listInvitations(ctx: WorkspaceContext): Promise<Result<InvitationView[]>> {
  const permission = requirePermission(ctx.role, "team.manage");
  if (!permission.ok) return permission;
  return withWorkspace(ctx, async (scope) => {
    const rows = await scope.tx
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .where(
        and(
          eq(invitations.workspaceId, scope.workspaceId),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
          gt(invitations.expiresAt, ctx.deps.clock.now()),
        ),
      )
      .orderBy(desc(invitations.createdAt));
    return ok(rows);
  });
}

export async function revokeInvitation(
  ctx: WorkspaceContext,
  invitationId: string,
): Promise<Result<true>> {
  const permission = requirePermission(ctx.role, "team.manage");
  if (!permission.ok) return permission;
  if (!z.uuid().safeParse(invitationId).success) return err(appError("VALIDATION"));
  return withWorkspace(ctx, async (scope) => {
    const [invitation] = await scope.tx
      .select({ role: invitations.role })
      .from(invitations)
      .where(
        and(
          eq(invitations.workspaceId, scope.workspaceId),
          eq(invitations.id, invitationId),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .for("update");
    if (!invitation) return err(appError("NOT_FOUND"));
    if (!canManageRole(ctx.role, invitation.role)) return err(appError("OWNER_PROTECTED"));
    await scope.tx
      .update(invitations)
      .set({ revokedAt: new Date() })
      .where(and(eq(invitations.workspaceId, scope.workspaceId), eq(invitations.id, invitationId)));
    await writeAudit(scope, {
      action: "invitation.revoked",
      objectType: "invitation",
      objectId: invitationId,
    });
    return ok(true as const);
  });
}

export interface InvitationPreview {
  workspaceName: string;
  email: string;
  role: MemberRole;
  state: "valid" | "expired" | "used";
}

/**
 * Token resolution (system context, concept chapter 16): the token is the capability – only
 * the invitation whose token is known can be read.
 */
async function findByToken(deps: CoreDeps, token: string) {
  if (token.length < 20 || token.length > 100) return undefined;
  return withSystem(systemContext(deps, "invitation-token"), async (tx) => {
    const [row] = await tx
      .select({
        id: invitations.id,
        workspaceId: invitations.workspaceId,
        email: invitations.email,
        role: invitations.role,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
        revokedAt: invitations.revokedAt,
        workspaceName: workspaces.name,
      })
      .from(invitations)
      .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
      .where(eq(invitations.tokenHash, sha256Hex(token)));
    return row;
  });
}

export async function previewInvitation(
  deps: CoreDeps,
  token: string,
): Promise<Result<InvitationPreview>> {
  const row = await findByToken(deps, token);
  if (!row || row.revokedAt) return err(appError("INVITATION_INVALID"));
  const state = row.acceptedAt ? "used" : row.expiresAt <= deps.clock.now() ? "expired" : "valid";
  return ok({ workspaceName: row.workspaceName, email: row.email, role: row.role, state });
}

export async function acceptInvitation(
  ctx: UserContext,
  token: string,
): Promise<Result<{ workspaceId: string }>> {
  const row = await findByToken(ctx.deps, token);
  if (!row || row.revokedAt || row.acceptedAt) return err(appError("INVITATION_INVALID"));
  if (row.expiresAt <= ctx.deps.clock.now()) return err(appError("INVITATION_EXPIRED"));
  if (!ctx.emailVerified) return err(appError("EMAIL_NOT_VERIFIED"));
  if (normalizeEmail(ctx.email) !== row.email) return err(appError("INVITATION_EMAIL_MISMATCH"));

  return withUser(ctx, async (scope) => {
    const claimed = await scope.tx
      .update(invitations)
      .set({ acceptedAt: new Date(), acceptedBy: scope.userId })
      .where(
        and(
          eq(invitations.id, row.id),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .returning({ id: invitations.id });
    if (claimed.length === 0) return err(appError("INVITATION_INVALID"));
    await scope.tx
      .insert(workspaceMembers)
      .values({ workspaceId: row.workspaceId, userId: scope.userId, role: row.role })
      .onConflictDoNothing();
    await writeUserAudit(scope, row.workspaceId, {
      action: "invitation.accepted",
      objectType: "invitation",
      objectId: row.id,
      data: { role: row.role },
    });
    return ok({ workspaceId: row.workspaceId });
  });
}
