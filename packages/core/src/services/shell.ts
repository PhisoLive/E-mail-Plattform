import { defaults } from "@ep/config/defaults";
import { agents, conversations, threads } from "@ep/db";
import { and, asc, count, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import type { WorkspaceContext } from "../context";
import { requirePermission } from "../permissions";
import { ok, type Result } from "../result";
import { withWorkspace } from "../scope";

const maxAgents = defaults.shell.sidebarAgents;
const maxConversations = defaults.shell.sidebarConversations;

export interface ShellSummary {
  /** Agents with the user's most recent conversations (sidebar, concept chapter 13). */
  agents: Array<{ id: string; name: string; conversations: Array<{ id: string; title: string }> }>;
  /** Threads that wait for the user: important or reply needed (badge of "Posteingang"). */
  inboxOpen: number;
}

export async function getShellSummary(ctx: WorkspaceContext): Promise<Result<ShellSummary>> {
  const permission = requirePermission(ctx.role, "workspace.view");
  if (!permission.ok) return permission;
  return withWorkspace(ctx, async (scope) => {
    const ws = scope.workspaceId;
    const agentRows = await scope.tx
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(and(eq(agents.workspaceId, ws), isNull(agents.deletedAt)))
      .orderBy(desc(agents.isDefault), asc(agents.name))
      .limit(maxAgents);
    const userId = ctx.actor.type === "user" ? ctx.actor.id : null;
    // Rank per agent in SQL and keep only the newest few – the shell renders on every page.
    const ranked = scope.tx
      .select({
        id: conversations.id,
        agentId: conversations.agentId,
        title: conversations.title,
        rank: sql<number>`row_number() over (partition by ${conversations.agentId} order by coalesce(${conversations.lastMessageAt}, ${conversations.createdAt}) desc)`.as(
          "rank",
        ),
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, ws),
          eq(conversations.userId, userId ?? ""),
          inArray(
            conversations.agentId,
            agentRows.map((agent) => agent.id),
          ),
        ),
      )
      .as("ranked");
    const conversationRows =
      userId && agentRows.length > 0
        ? await scope.tx
            .select()
            .from(ranked)
            .where(lte(ranked.rank, maxConversations))
            .orderBy(asc(ranked.rank))
        : [];
    const [open] = await scope.tx
      .select({ value: count() })
      .from(threads)
      .where(
        and(eq(threads.workspaceId, ws), inArray(threads.category, ["important", "needs_reply"])),
      );
    return ok({
      agents: agentRows.map((agent) => ({
        id: agent.id,
        name: agent.name,
        conversations: conversationRows
          .filter((row) => row.agentId === agent.id)
          .map((row) => ({ id: row.id, title: row.title })),
      })),
      inboxOpen: open?.value ?? 0,
    });
  });
}
