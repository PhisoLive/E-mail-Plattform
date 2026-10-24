import { randomUUID } from "node:crypto";
import {
  type CoreDeps,
  type MemberRole,
  type UserContext,
  type WorkspaceContext,
  workspaceContext,
  workspaceService,
} from "@ep/core";
import {
  agents,
  campaigns,
  contactLists,
  contacts,
  conversations,
  mailboxes,
  threads,
  user,
  workspaceMembers,
} from "@ep/db";

export interface TestUser {
  id: string;
  email: string;
  name: string;
}

export function uniqueEmail(prefix = "user"): string {
  return `${prefix}-${randomUUID().slice(0, 12)}@beispiel.test`;
}

export async function createTestUser(
  deps: CoreDeps,
  overrides: Partial<{ email: string; name: string; twoFactorEnabled: boolean }> = {},
): Promise<TestUser> {
  const email = overrides.email ?? uniqueEmail();
  const [row] = await deps.db
    .insert(user)
    .values({
      email,
      name: overrides.name ?? "Test Nutzer",
      emailVerified: true,
      twoFactorEnabled: overrides.twoFactorEnabled ?? true,
    })
    .returning({ id: user.id, email: user.email, name: user.name });
  if (!row) throw new Error("user insert failed");
  return row;
}

export function userContext(deps: CoreDeps, testUser: TestUser): UserContext {
  return { kind: "user", deps, userId: testUser.id, email: testUser.email, emailVerified: true };
}

export interface TestWorkspace {
  id: string;
  owner: TestUser;
  ownerCtx: WorkspaceContext;
}

export async function createTestWorkspace(
  deps: CoreDeps,
  name = "Testfirma GmbH",
): Promise<TestWorkspace> {
  const owner = await createTestUser(deps, { name: "Olga Owner" });
  const created = await workspaceService.createWorkspace(userContext(deps, owner), {
    name,
    country: "DE",
  });
  if (!created.ok) throw new Error(`workspace creation failed: ${created.error.code}`);
  return {
    id: created.value.id,
    owner,
    ownerCtx: workspaceContext(deps, created.value.id, { type: "user", id: owner.id }, "owner"),
  };
}

export async function addTestMember(
  deps: CoreDeps,
  workspace: TestWorkspace,
  role: MemberRole,
): Promise<{ user: TestUser; ctx: WorkspaceContext }> {
  const member = await createTestUser(deps, { name: `Mitglied ${role}` });
  await deps.db
    .insert(workspaceMembers)
    .values({ workspaceId: workspace.id, userId: member.id, role });
  return {
    user: member,
    ctx: workspaceContext(deps, workspace.id, { type: "user", id: member.id }, role),
  };
}

export interface PlaceholderObjects {
  campaignId: string;
  mailboxId: string;
  contactId: string;
  contactListId: string;
  agentId: string;
  threadId: string;
  conversationId: string;
}

/**
 * One object of every kind the app shell shows on a detail page (campaign, mailbox, contact,
 * list, agent, thread, conversation) – minimal rows for phase 1 tests until the feature phases
 * bring their own factories.
 */
export async function createPlaceholderObjects(
  deps: CoreDeps,
  workspace: TestWorkspace,
  label = "A",
): Promise<PlaceholderObjects> {
  const ws = workspace.id;
  const suffix = randomUUID().slice(0, 8);
  const [agent] = await deps.db
    .insert(agents)
    .values({
      workspaceId: ws,
      name: `Agent ${label}`,
      approvalThreshold: 25,
      allowedActions: [],
      replyPolicy: { autoReplyIntents: [], mode: "draft" },
      workingHours: { days: [1, 2, 3, 4, 5], start: "08:00", end: "17:00" },
      dailySendCap: 50,
      reportSchedule: { onCompletion: true, daily: false, weekly: false, time: "08:00" },
    })
    .returning({ id: agents.id });
  const [mailbox] = await deps.db
    .insert(mailboxes)
    .values({
      workspaceId: ws,
      email: `postfach-${suffix}@beispiel.test`,
      displayName: `Postfach ${label}`,
      provider: "imap_smtp",
    })
    .returning({ id: mailboxes.id });
  const [contact] = await deps.db
    .insert(contacts)
    .values({
      workspaceId: ws,
      email: `kontakt-${suffix}@beispiel.test`,
      emailHash: `hash-${suffix}`,
      firstName: "Erika",
      lastName: `Muster ${label}`,
    })
    .returning({ id: contacts.id });
  const [list] = await deps.db
    .insert(contactLists)
    .values({ workspaceId: ws, name: `Liste ${label}`, kind: "static" })
    .returning({ id: contactLists.id });
  const [campaign] = await deps.db
    .insert(campaigns)
    .values({ workspaceId: ws, kind: "bulk", name: `Auftrag ${label}` })
    .returning({ id: campaigns.id });
  if (!agent || !mailbox || !contact || !list || !campaign) throw new Error("insert failed");
  const [thread] = await deps.db
    .insert(threads)
    .values({ workspaceId: ws, mailboxId: mailbox.id, subjectNormalized: `Anfrage ${label}` })
    .returning({ id: threads.id });
  const [conversation] = await deps.db
    .insert(conversations)
    .values({
      workspaceId: ws,
      agentId: agent.id,
      userId: workspace.owner.id,
      title: `Gespräch ${label}`,
    })
    .returning({ id: conversations.id });
  if (!thread || !conversation) throw new Error("insert failed");
  return {
    campaignId: campaign.id,
    mailboxId: mailbox.id,
    contactId: contact.id,
    contactListId: list.id,
    agentId: agent.id,
    threadId: thread.id,
    conversationId: conversation.id,
  };
}
