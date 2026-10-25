"use client";

import { Alert, Button } from "@ep/ui";
import { useTranslations } from "next-intl";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { onWorkspaceSwitchedElsewhere, setActiveWorkspace } from "../lib/workspace-store";

export interface ActiveWorkspace {
  id: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
}

const WorkspaceContext = createContext<ActiveWorkspace | null>(null);

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: ActiveWorkspace | null;
  children: ReactNode;
}) {
  const t = useTranslations("shell");
  // Set synchronously before children render their first query.
  useState(() => setActiveWorkspace(workspace?.id ?? null));
  setActiveWorkspace(workspace?.id ?? null);
  const [switchedElsewhere, setSwitchedElsewhere] = useState(false);
  const workspaceId = workspace?.id ?? null;
  useEffect(
    () =>
      onWorkspaceSwitchedElsewhere((id) => {
        if (id !== workspaceId) setSwitchedElsewhere(true);
      }),
    [workspaceId],
  );
  return (
    <WorkspaceContext.Provider value={workspace}>
      {switchedElsewhere ? (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-3">
          <Alert tone="warning" className="flex max-w-xl flex-wrap items-center gap-3 shadow-lg">
            <span className="min-w-0 flex-1">{t("switchedElsewhere")}</span>
            <Button size="sm" onClick={() => window.location.reload()}>
              {t("reload")}
            </Button>
          </Alert>
        </div>
      ) : null}
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useActiveWorkspace(): ActiveWorkspace | null {
  return useContext(WorkspaceContext);
}
