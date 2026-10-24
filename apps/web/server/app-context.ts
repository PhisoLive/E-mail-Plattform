import "server-only";
import { defaults } from "@ep/config/defaults";
import type { MemberRole } from "@ep/core";
import { redirect } from "next/navigation";
import { cache } from "react";
import { serverCaller } from "./caller";
import { currentSession, selectedWorkspaceId } from "./session";
import type { SessionInfo } from "./trpc/context";

export interface AppContext {
  session: SessionInfo;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    role: MemberRole;
    trustLevel: string;
  }>;
  active: { id: string; name: string; slug: string; role: MemberRole; trustLevel: string } | null;
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
