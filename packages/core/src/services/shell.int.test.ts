import { defaults } from "@ep/config/defaults";
import { conversations, threads } from "@ep/db";
import {
  addTestMember,
  createPlaceholderObjects,
  createTestDeps,
  createTestWorkspace,
} from "@ep/testing";
import { describe, expect, it } from "vitest";
import { getShellSummary } from "./shell";

const deps = createTestDeps();

describe("shell summary", () => {
  it("lists agents with the user's recent conversations and counts open threads", async () => {
    const workspace = await createTestWorkspace(deps);
    const objects = await createPlaceholderObjects(deps, workspace);
    for (const title of ["Älter", "Neuer", "Neuest", "Ganz neu"]) {
      await deps.db.insert(conversations).values({
        workspaceId: workspace.id,
        agentId: objects.agentId,
        userId: workspace.owner.id,
        title,
        lastMessageAt: new Date(Date.now() + title.length * 1000),
      });
    }
    await deps.db.insert(threads).values([
      { workspaceId: workspace.id, mailboxId: objects.mailboxId, category: "needs_reply" },
      { workspaceId: workspace.id, mailboxId: objects.mailboxId, category: "important" },
      { workspaceId: workspace.id, mailboxId: objects.mailboxId, category: "done" },
    ]);
    const result = await getShellSummary(workspace.ownerCtx);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.inboxOpen).toBe(2);
    expect(result.value.agents).toHaveLength(1);
    expect(result.value.agents[0]?.conversations).toHaveLength(defaults.shell.sidebarConversations);
  });

  it("shows nobody else's conversations and nothing of other workspaces", async () => {
    const a = await createTestWorkspace(deps);
    const b = await createTestWorkspace(deps);
    await createPlaceholderObjects(deps, a);
    const colleague = await addTestMember(deps, a, "member");
    const colleagueView = await getShellSummary(colleague.ctx);
    expect(colleagueView.ok && colleagueView.value.agents[0]?.conversations).toEqual([]);
    const other = await getShellSummary(b.ownerCtx);
    expect(other).toEqual({ ok: true, value: { agents: [], inboxOpen: 0 } });
  });
});
