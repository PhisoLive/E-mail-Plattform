"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { setActiveWorkspace } from "../lib/workspace-store";

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
  // Set synchronously before children render their first query.
  useState(() => setActiveWorkspace(workspace?.id ?? null));
  setActiveWorkspace(workspace?.id ?? null);
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}

export function useActiveWorkspace(): ActiveWorkspace | null {
  return useContext(WorkspaceContext);
}
