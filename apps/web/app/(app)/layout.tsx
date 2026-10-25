import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppFrame } from "../../components/shell/app-frame";
import { shellContext } from "../../server/app-context";

/** App shell. Page-level guards (session, workspace, 2FA) live in requireAppContext(). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await shellContext();
  if (!context) redirect("/login");
  return <AppFrame context={context}>{children}</AppFrame>;
}
