import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { WorkspaceProvider } from "../../components/workspace-provider";
import { shellContext } from "../../server/app-context";

/** Focused frame for the onboarding: no sidebar, one task at a time. */
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const context = await shellContext();
  if (!context) redirect("/login");
  // Checked here as well, before the loading boundary: a full page load gets a real HTTP
  // redirect instead of a 200 that redirects only after hydration. The page keeps its own
  // check for client navigations, which do not re-render this layout (E-019).
  if (context.needsTwoFactor) redirect("/einstellungen/profil");
  const active = context.active
    ? { id: context.active.id, name: context.active.name, role: context.active.role }
    : null;
  return (
    <WorkspaceProvider workspace={active}>
      <main
        id="inhalt"
        className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8 sm:py-12"
      >
        {children}
      </main>
    </WorkspaceProvider>
  );
}
