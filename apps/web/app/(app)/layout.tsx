import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { SignOutButton } from "../../components/sign-out-button";
import { WorkspaceProvider } from "../../components/workspace-provider";
import { shellContext } from "../../server/app-context";

/** App shell. Page-level guards (session, workspace, 2FA) live in requireAppContext(). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await shellContext();
  if (!context) redirect("/login");
  const active = context.active;
  const t = await getTranslations();
  return (
    <WorkspaceProvider
      workspace={active ? { id: active.id, name: active.name, role: active.role } : null}
    >
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        {t("common.skipToContent")}
      </a>
      <div className="flex min-h-dvh flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
            <Link
              href="/start"
              className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
            >
              <span
                aria-hidden="true"
                className="inline-block size-6 shrink-0 rounded-md bg-accent"
              />
              <span className="truncate">{active?.name ?? t("app.name")}</span>
            </Link>
            <nav aria-label={t("settings.title")} className="flex items-center gap-1 text-sm">
              <Link className="rounded-md px-3 py-1.5 hover:bg-surface-muted" href="/start">
                {t("start.title")}
              </Link>
              <Link
                className="rounded-md px-3 py-1.5 hover:bg-surface-muted"
                href="/einstellungen/team"
              >
                {t("settings.team.title")}
              </Link>
              <Link
                className="rounded-md px-3 py-1.5 hover:bg-surface-muted"
                href="/einstellungen/profil"
              >
                {t("settings.profile.title")}
              </Link>
              <SignOutButton />
            </nav>
          </div>
        </header>
        <main id="inhalt" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
