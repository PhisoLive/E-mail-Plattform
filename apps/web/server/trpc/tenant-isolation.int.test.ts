/**
 * Tenant isolation for every tRPC procedure (concept chapters 16 and 19):
 * "Nutzer aus Arbeitsbereich A kann nichts aus B lesen oder ändern".
 *
 * The last test fails as soon as a procedure is added without a case here – every new
 * procedure needs its own cross-tenant attempt.
 */
import { invitationService, workspaceService } from "@ep/core";
import { invitations, workspaceMembers, workspaces } from "@ep/db";
import type { SystemMailer } from "@ep/mail";
import {
  addTestMember,
  createTestDeps,
  createTestWorkspace,
  type TestUser,
  type TestWorkspace,
  userContext,
} from "@ep/testing";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { SessionInfo, TrpcContext } from "./context";
import { createCallerFactory } from "./init";
import { appRouter } from "./routers/_app";

const deps = createTestDeps();
const sentMails: string[] = [];
const mailer: SystemMailer = {
  async send(mail) {
    sentMails.push(mail.to);
  },
  close() {},
};
const createCaller = createCallerFactory(appRouter);

function sessionOf(user: TestUser): SessionInfo {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    emailVerified: true,
    twoFactorEnabled: true,
    platformRole: "user",
    signedInAt: new Date(),
  };
}

function callerFor(user: TestUser, workspaceId: string | null) {
  const ctx: TrpcContext = {
    deps,
    session: sessionOf(user),
    workspaceId,
    mailer,
    webUrl: "http://127.0.0.1:4300",
  };
  return createCaller(ctx);
}

async function expectCode(promise: Promise<unknown>, code: string) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(TRPCError);
  expect((error as TRPCError).message).toBe(code);
}

let a: TestWorkspace;
let b: TestWorkspace;
let aMemberId: string;
let aInvitationId: string;
let aInvitationToken: string;

beforeAll(async () => {
  a = await createTestWorkspace(deps, "Arbeitsbereich A");
  b = await createTestWorkspace(deps, "Arbeitsbereich B");
  const member = await addTestMember(deps, a, "member");
  const [row] = await deps.db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, member.user.id));
  aMemberId = row?.id ?? "";
  const invitation = await invitationService.createInvitation(a.ownerCtx, {
    email: "einladung-a@beispiel.test",
    role: "member",
  });
  if (!invitation.ok) throw new Error("invitation failed");
  aInvitationId = invitation.value.id;
  aInvitationToken = invitation.value.token;
});

/** One cross-tenant attempt per procedure: the owner of B attacks A. */
const cases: Record<string, () => Promise<void>> = {
  "workspace.list": async () => {
    const list = await callerFor(b.owner, null).workspace.list();
    expect(list.map((entry) => entry.id)).not.toContain(a.id);
  },
  "workspace.create": async () => {
    const created = await callerFor(b.owner, a.id).workspace.create({ name: "Neu von B" });
    expect(created.id).not.toBe(a.id);
    expect(await workspaceService.getMembershipRole(userContext(deps, b.owner), a.id)).toBeNull();
  },
  "workspace.current": async () => {
    await expectCode(callerFor(b.owner, a.id).workspace.current(), "FORBIDDEN");
  },
  "workspace.update": async () => {
    await expectCode(callerFor(b.owner, a.id).workspace.update({ name: "Gekapert" }), "FORBIDDEN");
    const [row] = await deps.db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, a.id));
    expect(row?.name).toBe("Arbeitsbereich A");
  },
  "workspace.me": async () => {
    const me = await callerFor(b.owner, a.id).workspace.me();
    expect(me.email).toBe(b.owner.email);
  },
  "team.members": async () => {
    await expectCode(callerFor(b.owner, a.id).team.members(), "FORBIDDEN");
    const own = await callerFor(b.owner, b.id).team.members();
    expect(own.map((member) => member.id)).not.toContain(aMemberId);
  },
  "team.changeRole": async () => {
    await expectCode(
      callerFor(b.owner, a.id).team.changeRole({ memberId: aMemberId, role: "admin" }),
      "FORBIDDEN",
    );
    await expectCode(
      callerFor(b.owner, b.id).team.changeRole({ memberId: aMemberId, role: "admin" }),
      "NOT_FOUND",
    );
  },
  "team.removeMember": async () => {
    await expectCode(
      callerFor(b.owner, a.id).team.removeMember({ memberId: aMemberId }),
      "FORBIDDEN",
    );
    await expectCode(
      callerFor(b.owner, b.id).team.removeMember({ memberId: aMemberId }),
      "NOT_FOUND",
    );
    const [row] = await deps.db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, aMemberId));
    expect(row?.role).toBe("member");
  },
  "team.invitations": async () => {
    await expectCode(callerFor(b.owner, a.id).team.invitations(), "FORBIDDEN");
    const own = await callerFor(b.owner, b.id).team.invitations();
    expect(own.map((invitation) => invitation.id)).not.toContain(aInvitationId);
  },
  "team.invite": async () => {
    await expectCode(
      callerFor(b.owner, a.id).team.invite({ email: "fremd@beispiel.test", role: "admin" }),
      "FORBIDDEN",
    );
  },
  "team.revokeInvitation": async () => {
    await expectCode(
      callerFor(b.owner, a.id).team.revokeInvitation({ invitationId: aInvitationId }),
      "FORBIDDEN",
    );
    await expectCode(
      callerFor(b.owner, b.id).team.revokeInvitation({ invitationId: aInvitationId }),
      "NOT_FOUND",
    );
    const [row] = await deps.db.select().from(invitations).where(eq(invitations.id, aInvitationId));
    expect(row?.revokedAt).toBeNull();
  },
  "invitation.preview": async () => {
    await expectCode(
      callerFor(b.owner, b.id).invitation.preview({ token: "x".repeat(43) }),
      "INVITATION_INVALID",
    );
  },
  "invitation.accept": async () => {
    await expectCode(
      callerFor(b.owner, b.id).invitation.accept({ token: aInvitationToken }),
      "INVITATION_EMAIL_MISMATCH",
    );
    expect(await workspaceService.getMembershipRole(userContext(deps, b.owner), a.id)).toBeNull();
  },
};

describe("tenant isolation of tRPC procedures", () => {
  for (const [path, attempt] of Object.entries(cases)) {
    it(`${path}: workspace B cannot read or change workspace A`, attempt);
  }

  it("covers every procedure of the app router", () => {
    const procedures = Object.keys(appRouter._def.procedures).sort();
    expect(Object.keys(cases).sort()).toEqual(procedures);
  });

  it("rejects requests without session or workspace", async () => {
    const anonymous = createCaller({
      deps,
      session: null,
      workspaceId: a.id,
      mailer,
      webUrl: "http://x",
    });
    await expectCode(anonymous.workspace.current(), "UNAUTHENTICATED");
    await expectCode(callerFor(a.owner, null).workspace.current(), "FORBIDDEN");
    await expectCode(callerFor(a.owner, "not-a-uuid").workspace.current(), "FORBIDDEN");
  });

  it("requires 2FA for owners and admins", async () => {
    const ctx: TrpcContext = {
      deps,
      session: { ...sessionOf(a.owner), twoFactorEnabled: false },
      workspaceId: a.id,
      mailer,
      webUrl: "http://x",
    };
    await expectCode(createCaller(ctx).team.members(), "TWO_FACTOR_REQUIRED");
    // Reading the workspace itself stays possible to show the 2FA prompt.
    expect((await createCaller(ctx).workspace.current()).id).toBe(a.id);
  });

  it("requires a fresh sign-in for sensitive actions", async () => {
    const ctx: TrpcContext = {
      deps,
      session: { ...sessionOf(a.owner), signedInAt: new Date(Date.now() - 16 * 60_000) },
      workspaceId: a.id,
      mailer,
      webUrl: "http://x",
    };
    await expectCode(
      createCaller(ctx).team.invite({ email: "neu2@beispiel.test", role: "member" }),
      "FRESH_LOGIN_REQUIRED",
    );
  });
});
