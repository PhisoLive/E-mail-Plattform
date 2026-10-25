import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { AppContext } from "../../server/app-context";
import { activeCaller } from "../../server/workspace-caller";
import { WorkspaceProvider } from "../workspace-provider";
import { AppShell } from "./app-shell";
import { sidebarCookie } from "./types";

/** Server part of the app shell: workspace, user, sidebar state and sidebar data. */
export async function AppFrame({
  context,
  children,
}: {
  context: AppContext;
  children: ReactNode;
}) {
  const active = context.active
    ? { id: context.active.id, name: context.active.name, role: context.active.role }
    : null;
  const collapsed = (await cookies()).get(sidebarCookie)?.value === "collapsed";
  // Agents and inbox counter; before 2FA (owners/admins) or without workspace the sidebar stays empty.
  const summary =
    active && !context.needsTwoFactor
      ? await (await activeCaller()).workspace.shell().catch(() => null)
      : null;
  // The label of the operator area only reaches platform admins (E-041).
  const adminLabel =
    context.session.platformRole === "platform_admin"
      ? (await getTranslations("admin"))("title")
      : undefined;
  return (
    <WorkspaceProvider workspace={active}>
      <AppShell
        user={{
          name: context.session.name,
          email: context.session.email,
          ...(adminLabel ? { adminLabel } : {}),
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
