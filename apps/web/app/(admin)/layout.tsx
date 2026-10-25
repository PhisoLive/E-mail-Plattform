import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppFrame } from "../../components/shell/app-frame";
import { platformAdminContext } from "../../server/app-context";

/**
 * Operator area (concept chapter 14) in its own route group without a loading boundary: for
 * everyone except platform admins it answers exactly like an unknown route (404, E-041).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const context = await platformAdminContext();
  if (!context) notFound();
  return <AppFrame context={context}>{children}</AppFrame>;
}
