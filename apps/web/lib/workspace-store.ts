"use client";

/** Active workspace of the client; sent as `x-workspace-id` with every tRPC request. */
let current: string | null = null;

export function setActiveWorkspace(id: string | null): void {
  current = id;
}

export function activeWorkspace(): string | null {
  return current;
}

export async function selectWorkspace(workspaceId: string): Promise<boolean> {
  const response = await fetch("/api/workspace/select", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspaceId }),
  });
  if (response.ok) current = workspaceId;
  return response.ok;
}
