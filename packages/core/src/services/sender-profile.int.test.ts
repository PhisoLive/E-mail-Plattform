import { auditLogs, senderProfiles } from "@ep/db";
import { addTestMember, createTestDeps, createTestWorkspace } from "@ep/testing";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getSenderProfile, updateSenderProfile } from "./sender-profile";

const deps = createTestDeps();

const gmbh = {
  legalForm: "gmbh",
  companyName: "Bäckerei Huber GmbH",
  address: { street: "Hauptstraße 1", postalCode: "80331", city: "München" },
  registerCourt: "Amtsgericht München",
  registerNumber: "HRB 123456",
  managingDirectors: "Anna Huber",
  vatId: "DE123456789",
  website: "www.baeckerei-huber.de",
};

describe("sender profile service", () => {
  it("starts incomplete and lists the mandatory fields of the legal form", async () => {
    const workspace = await createTestWorkspace(deps, "Neue Firma");
    const result = await getSenderProfile(workspace.ownerCtx);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.complete).toBe(false);
    expect(result.value.profile.companyName).toBe("Neue Firma");
    expect(result.value.workspace).toEqual({ kind: "business", country: "DE" });
  });

  it("saves the mandatory details of a GmbH and reads them back normalized", async () => {
    const workspace = await createTestWorkspace(deps);
    const saved = await updateSenderProfile(workspace.ownerCtx, gmbh);
    expect(saved).toEqual({ ok: true, value: { complete: true } });

    const result = await getSenderProfile(workspace.ownerCtx);
    expect(result.ok && result.value.complete).toBe(true);
    if (!result.ok) return;
    expect(result.value.profile).toMatchObject({
      legalForm: "gmbh",
      companyName: "Bäckerei Huber GmbH",
      address: { street: "Hauptstraße 1", postalCode: "80331", city: "München", country: "DE" },
      registerCourt: "Amtsgericht München",
      registerNumber: "HRB 123456",
      managingDirectors: "Anna Huber",
      vatId: "DE123456789",
      website: "https://www.baeckerei-huber.de/",
    });
    expect(result.value.required).toContain("managingDirectors");

    const audit = await deps.db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.workspaceId, workspace.id),
          eq(auditLogs.action, "sender_profile.updated"),
        ),
      );
    expect(audit).toHaveLength(1);
    // Only field names, never the values.
    expect(JSON.stringify(audit[0]?.data)).not.toContain("Huber");
  });

  it("rejects a profile without the mandatory fields and keeps the old one", async () => {
    const workspace = await createTestWorkspace(deps);
    await updateSenderProfile(workspace.ownerCtx, gmbh);
    const result = await updateSenderProfile(workspace.ownerCtx, {
      ...gmbh,
      legalForm: "ag",
      registerNumber: "",
    });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        fields: { registerNumber: "required", supervisoryBoardChair: "required" },
      },
    });
    const [row] = await deps.db
      .select()
      .from(senderProfiles)
      .where(eq(senderProfiles.workspaceId, workspace.id));
    expect(row?.legalForm).toBe("gmbh");
    expect(row?.registerNumber).toBe("HRB 123456");
  });

  it("lets only owners and admins change the profile; everyone may read it", async () => {
    const workspace = await createTestWorkspace(deps);
    const admin = await addTestMember(deps, workspace, "admin");
    const member = await addTestMember(deps, workspace, "member");
    const viewer = await addTestMember(deps, workspace, "viewer");
    expect((await updateSenderProfile(admin.ctx, gmbh)).ok).toBe(true);
    expect(await updateSenderProfile(member.ctx, gmbh)).toEqual({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    expect(await updateSenderProfile(viewer.ctx, gmbh)).toEqual({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    expect((await getSenderProfile(viewer.ctx)).ok).toBe(true);
  });

  it("never touches the profile of another workspace", async () => {
    const a = await createTestWorkspace(deps, "Firma A GmbH");
    const b = await createTestWorkspace(deps, "Firma B GmbH");
    await updateSenderProfile(a.ownerCtx, gmbh);
    const [other] = await deps.db
      .select()
      .from(senderProfiles)
      .where(eq(senderProfiles.workspaceId, b.id));
    expect(other?.companyName).toBe("Firma B GmbH");
    expect(other?.registerNumber).toBeNull();
    const readB = await getSenderProfile(b.ownerCtx);
    expect(readB.ok && readB.value.profile.companyName).toBe("Firma B GmbH");
  });

  it("creates the row if a workspace has none yet", async () => {
    const workspace = await createTestWorkspace(deps);
    await deps.db.delete(senderProfiles).where(eq(senderProfiles.workspaceId, workspace.id));
    expect((await getSenderProfile(workspace.ownerCtx)).ok).toBe(true);
    expect((await updateSenderProfile(workspace.ownerCtx, gmbh)).ok).toBe(true);
    const rows = await deps.db
      .select()
      .from(senderProfiles)
      .where(eq(senderProfiles.workspaceId, workspace.id));
    expect(rows).toHaveLength(1);
  });
});
