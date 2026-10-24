import {
  agents,
  campaigns,
  contactLists,
  contacts,
  conversations,
  mailboxes,
  threads,
} from "@ep/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { WorkspaceContext } from "../context";
import { appError } from "../errors";
import { requirePermission } from "../permissions";
import { err, ok, type Result } from "../result";
import { withWorkspace } from "../scope";

/**
 * Minimal read access for the detail pages of the app shell (phase 1 placeholders): title and
 * status of one object of the current workspace. The feature phases replace it with their own
 * services; until then the routes already show real objects – and never those of another tenant.
 */
export const lookupKinds = [
  "campaign",
  "mailbox",
  "contact",
  "contactList",
  "agent",
  "thread",
  "conversation",
] as const;
export type LookupKind = (typeof lookupKinds)[number];

export const lookupInput = z.object({ kind: z.enum(lookupKinds), id: z.uuid() });

export interface LookupResult {
  kind: LookupKind;
  id: string;
  title: string;
  status: string | null;
  /** Owning object: agent of a conversation, mailbox of a thread. */
  parentId: string | null;
}

export async function lookupObject(
  ctx: WorkspaceContext,
  input: z.input<typeof lookupInput>,
): Promise<Result<LookupResult>> {
  const permission = requirePermission(ctx.role, "workspace.view");
  if (!permission.ok) return permission;
  const parsed = lookupInput.safeParse(input);
  if (!parsed.success) return err(appError("NOT_FOUND"));
  const { kind, id } = parsed.data;
  return withWorkspace(ctx, async (scope) => {
    const ws = scope.workspaceId;
    let row: { title: string; status: string | null; parentId?: string | null } | undefined;
    switch (kind) {
      case "campaign":
        [row] = await scope.tx
          .select({ title: campaigns.name, status: campaigns.status })
          .from(campaigns)
          .where(and(eq(campaigns.workspaceId, ws), eq(campaigns.id, id)));
        break;
      case "mailbox":
        [row] = await scope.tx
          .select({ title: mailboxes.email, status: mailboxes.status })
          .from(mailboxes)
          .where(and(eq(mailboxes.workspaceId, ws), eq(mailboxes.id, id)));
        break;
      case "contact": {
        const [contact] = await scope.tx
          .select({
            email: contacts.email,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
          })
          .from(contacts)
          .where(and(eq(contacts.workspaceId, ws), eq(contacts.id, id)));
        if (contact) {
          const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
          row = { title: name || contact.email, status: null };
        }
        break;
      }
      case "contactList":
        [row] = await scope.tx
          .select({ title: contactLists.name, status: contactLists.kind })
          .from(contactLists)
          .where(
            and(
              eq(contactLists.workspaceId, ws),
              eq(contactLists.id, id),
              isNull(contactLists.deletedAt),
            ),
          );
        break;
      case "agent":
        [row] = await scope.tx
          .select({ title: agents.name, status: agents.roleTemplate })
          .from(agents)
          .where(and(eq(agents.workspaceId, ws), eq(agents.id, id), isNull(agents.deletedAt)));
        break;
      case "thread":
        [row] = await scope.tx
          .select({
            title: threads.subjectNormalized,
            status: threads.category,
            parentId: threads.mailboxId,
          })
          .from(threads)
          .where(and(eq(threads.workspaceId, ws), eq(threads.id, id)));
        break;
      case "conversation": {
        // Conversations belong to the user who started them (concept chapter 11).
        const userId = ctx.actor.type === "user" ? ctx.actor.id : null;
        if (!userId) return err(appError("NOT_FOUND"));
        [row] = await scope.tx
          .select({
            title: conversations.title,
            status: sql<null>`null`,
            parentId: conversations.agentId,
          })
          .from(conversations)
          .where(
            and(
              eq(conversations.workspaceId, ws),
              eq(conversations.id, id),
              eq(conversations.userId, userId),
            ),
          );
        break;
      }
    }
    if (!row) return err(appError("NOT_FOUND"));
    return ok({ kind, id, title: row.title, status: row.status, parentId: row.parentId ?? null });
  });
}
