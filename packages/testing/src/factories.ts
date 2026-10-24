import { randomUUID } from "node:crypto";
import {
  type CoreDeps,
  type MemberRole,
  type UserContext,
  type WorkspaceContext,
  workspaceContext,
  workspaceService,
} from "@ep/core";
import { user, workspaceMembers } from "@ep/db";

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
