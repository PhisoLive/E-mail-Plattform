import type { MemberRole } from "./context";
import { appError } from "./errors";
import { err, ok, type Result } from "./result";

/** Rights matrix from concept chapter 16. */
export const permissions = {
  "workspace.view": ["owner", "admin", "member", "viewer"],
  "campaign.manage": ["owner", "admin", "member"],
  "inbox.reply": ["owner", "admin", "member"],
  "approval.decide": ["owner", "admin", "member"],
  "contact.manage": ["owner", "admin", "member"],
  "contact.import": ["owner", "admin", "member"],
  "contact.export": ["owner", "admin"],
  "mailbox.manage": ["owner", "admin"],
  "agent.manage": ["owner", "admin"],
  "team.manage": ["owner", "admin"],
  "settings.manage": ["owner", "admin"],
  "billing.manage": ["owner"],
  "workspace.delete": ["owner"],
  "workspace.export": ["owner"],
} as const satisfies Record<string, readonly MemberRole[]>;

export type Permission = keyof typeof permissions;

export function can(role: MemberRole, permission: Permission): boolean {
  return (permissions[permission] as readonly MemberRole[]).includes(role);
}

export function requirePermission(role: MemberRole, permission: Permission): Result<true> {
  return can(role, permission) ? ok(true) : err(appError("FORBIDDEN"));
}

/** Admins manage the team but never touch owners (concept chapter 16). */
export function canManageRole(
  actorRole: MemberRole,
  targetRole: MemberRole,
  newRole?: MemberRole,
): boolean {
  if (!can(actorRole, "team.manage")) return false;
  if (actorRole === "owner") return true;
  return targetRole !== "owner" && newRole !== "owner";
}

export const memberRoles: readonly MemberRole[] = ["owner", "admin", "member", "viewer"];
