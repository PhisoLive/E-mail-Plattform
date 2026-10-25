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
  if (response.ok) {
    current = workspaceId;
    announce(workspaceId);
  }
  return response.ok;
}

/*
 * The cookie `ep_ws` is shared by all tabs, the module variable is not: after a switch in one
 * tab the others would render server parts for the new and client parts for the old workspace.
 * Other tabs are told about the switch and offer a reload.
 */
const channelName = "ep-workspace";
/** Messages of this tab reach its own listeners too – they are recognised by this id. */
const tabId = typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random());

function announce(workspaceId: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(channelName);
  channel.postMessage({ workspaceId, tabId });
  channel.close();
}

/** Calls `listener` when another tab of this browser switches the workspace. */
export function onWorkspaceSwitchedElsewhere(listener: (workspaceId: string) => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(channelName);
  channel.onmessage = (event: MessageEvent<{ workspaceId?: unknown; tabId?: unknown }>) => {
    if (event.data?.tabId === tabId) return;
    if (typeof event.data?.workspaceId === "string") listener(event.data.workspaceId);
  };
  return () => channel.close();
}
