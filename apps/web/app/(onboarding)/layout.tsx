import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { WorkspaceProvider } from "../../components/workspace-provider";
import { shellContext } from "../../server/app-context";

/** Focused frame for the onboarding: no sidebar, one task at a time. */
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const context = await shellContext();
  if (!context) redirect("/login");
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
