import {
  addTestMember,
  createPlaceholderObjects,
  createTestDeps,
  createTestWorkspace,
} from "@ep/testing";
import { describe, expect, it } from "vitest";
import { type LookupKind, lookupObject } from "./lookup";

const deps = createTestDeps();

describe("lookup of detail objects", () => {
  it("finds every kind in the own workspace", async () => {
    const workspace = await createTestWorkspace(deps);
    const objects = await createPlaceholderObjects(deps, workspace);
    const expected: Record<LookupKind, [string, string]> = {
      campaign: [objects.campaignId, "Auftrag A"],
      mailbox: [objects.mailboxId, "postfach-"],
      contact: [objects.contactId, "Erika Muster A"],
      contactList: [objects.contactListId, "Liste A"],
      agent: [objects.agentId, "Agent A"],
      thread: [objects.threadId, "Anfrage A"],
      conversation: [objects.conversationId, "Gespräch A"],
    };
    for (const [kind, [id, title]] of Object.entries(expected) as Array<
      [LookupKind, [string, string]]
    >) {
      const result = await lookupObject(workspace.ownerCtx, { kind, id });
      expect(result.ok, kind).toBe(true);
      if (result.ok) expect(result.value.title).toContain(title);
    }
    const conversation = await lookupObject(workspace.ownerCtx, {
      kind: "conversation",
      id: objects.conversationId,
    });
    expect(conversation.ok && conversation.value.parentId).toBe(objects.agentId);
  });

  it("never returns objects of another workspace", async () => {
    const a = await createTestWorkspace(deps);
    const b = await createTestWorkspace(deps);
    const objects = await createPlaceholderObjects(deps, a);
    for (const [kind, id] of [
      ["campaign", objects.campaignId],
      ["mailbox", objects.mailboxId],
      ["contact", objects.contactId],
      ["contactList", objects.contactListId],
      ["agent", objects.agentId],
      ["thread", objects.threadId],
      ["conversation", objects.conversationId],
    ] as Array<[LookupKind, string]>) {
      expect(await lookupObject(b.ownerCtx, { kind, id }), kind).toEqual({
        ok: false,
        error: { code: "NOT_FOUND" },
      });
    }
  });

  it("shows a conversation only to the user who started it", async () => {
    const workspace = await createTestWorkspace(deps);
    const objects = await createPlaceholderObjects(deps, workspace);
    const colleague = await addTestMember(deps, workspace, "admin");
    expect(
      await lookupObject(colleague.ctx, { kind: "conversation", id: objects.conversationId }),
    ).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("answers malformed ids with NOT_FOUND", async () => {
    const workspace = await createTestWorkspace(deps);
    expect(await lookupObject(workspace.ownerCtx, { kind: "campaign", id: "kein-uuid" })).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });
});
