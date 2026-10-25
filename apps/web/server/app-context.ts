import "server-only";
import { defaults } from "@ep/config/defaults";
import type { MemberRole } from "@ep/core";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { serverCaller } from "./caller";
import { currentSession, selectedWorkspaceId } from "./session";
import type { SessionInfo } from "./trpc/context";

type WorkspaceEntry = {
  id: string;
  name: string;
  slug: string;
  role: MemberRole;
  trustLevel: string;
  timezone: string;
};

export interface AppContext {
  session: SessionInfo;
  workspaces: WorkspaceEntry[];
  active: WorkspaceEntry | null;
  needsTwoFactor: boolean;
}

const load = cache(async (): Promise<AppContext | null> => {
  const session = await currentSession();
  if (!session) return null;
  const workspaces = await (await serverCaller()).workspace.list();
  const selected = await selectedWorkspaceId();
  const active = workspaces.find((workspace) => workspace.id === selected) ?? workspaces[0] ?? null;
  const needsTwoFactor =
    active !== null &&
    (defaults.auth.require2faRoles as readonly string[]).includes(active.role) &&
    !session.twoFactorEnabled;
  return { session, workspaces, active, needsTwoFactor };
});

export interface PageGuard {
  /** Current path – used as `next` after sign-in. */
  path: string;
  allowWithoutWorkspace?: boolean;
  allowWithoutTwoFactor?: boolean;
}

/**
 * Guard for every page of the app (Next 16 does not re-render layouts on navigation, so the
 * checks run per page): session, workspace and 2FA duty for owners and admins.
 */
export async function requireAppContext(
  guard: PageGuard,
): Promise<AppContext & { active: NonNullable<AppContext["active"]> }>;
export async function requireAppContext(
  guard: PageGuard & { allowWithoutWorkspace: true },
): Promise<AppContext>;
export async function requireAppContext(guard: PageGuard): Promise<AppContext> {
  const context = await load();
  if (!context) redirect(`/login?next=${encodeURIComponent(guard.path)}`);
  if (!context.active && !guard.allowWithoutWorkspace) redirect("/willkommen");
  if (context.needsTwoFactor && !guard.allowWithoutTwoFactor) redirect("/einstellungen/profil");
  return context;
}

/** For the shell: no redirects except a missing session. */
export async function shellContext(): Promise<AppContext | null> {
  return load();
}

/**
 * Context of a platform admin, or null for everyone else – anonymous visitors included, so the
 * operator area answers like an unknown route and reveals nothing (concept chapter 14, E-041).
 */
export async function platformAdminContext(): Promise<AppContext | null> {
  const context = await load();
  if (context?.session.platformRole !== "platform_admin") return null;
  return context;
}

/** Guard of every page in the operator area: platform admin with 2FA, otherwise 404. */
export async function requirePlatformAdmin(): Promise<AppContext> {
  const context = await platformAdminContext();
  if (!context) notFound();
  // Platform admins always need a second factor (concept chapter 14).
  if (!context.session.twoFactorEnabled) redirect("/einstellungen/profil");
  return context;
}
