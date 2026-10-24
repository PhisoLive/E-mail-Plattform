import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../components/shell/app-shell";
import { sidebarCookie } from "../../components/shell/types";
import { WorkspaceProvider } from "../../components/workspace-provider";
import { shellContext } from "../../server/app-context";
import { activeCaller } from "../../server/workspace-caller";

/** App shell. Page-level guards (session, workspace, 2FA) live in requireAppContext(). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await shellContext();
  if (!context) redirect("/login");
  const active = context.active
    ? { id: context.active.id, name: context.active.name, role: context.active.role }
    : null;
  const collapsed = (await cookies()).get(sidebarCookie)?.value === "collapsed";
  // Agents and inbox counter; before 2FA (owners/admins) or without workspace the sidebar stays empty.
  const summary =
    active && !context.needsTwoFactor
      ? await (await activeCaller()).workspace.shell().catch(() => null)
      : null;
  return (
    <WorkspaceProvider workspace={active}>
      <AppShell
        user={{
          name: context.session.name,
          email: context.session.email,
          isPlatformAdmin: context.session.platformRole === "platform_admin",
        }}
        workspaces={context.workspaces.map(({ id, name, role }) => ({ id, name, role }))}
        active={active}
        initialCollapsed={collapsed}
        agents={summary?.agents ?? []}
        inboxCount={summary?.inboxOpen ?? 0}
      >
        {children}
      </AppShell>
    </WorkspaceProvider>
  );
}
