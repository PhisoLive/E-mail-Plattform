import { describe, expect, it } from "vitest";
import { can, canManageRole } from "./permissions";

describe("rights matrix (concept chapter 16)", () => {
  it("lets viewers only look", () => {
    expect(can("viewer", "workspace.view")).toBe(true);
    expect(can("viewer", "campaign.manage")).toBe(false);
    expect(can("viewer", "contact.import")).toBe(false);
  });

  it("lets members work but not export or connect mailboxes", () => {
    expect(can("member", "campaign.manage")).toBe(true);
    expect(can("member", "contact.import")).toBe(true);
    expect(can("member", "contact.export")).toBe(false);
    expect(can("member", "mailbox.manage")).toBe(false);
  });

  it("reserves billing and deletion for owners", () => {
    expect(can("admin", "billing.manage")).toBe(false);
    expect(can("admin", "workspace.delete")).toBe(false);
    expect(can("owner", "workspace.export")).toBe(true);
  });

  it("protects owners from admins", () => {
    expect(canManageRole("admin", "member", "viewer")).toBe(true);
    expect(canManageRole("admin", "owner", "member")).toBe(false);
    expect(canManageRole("admin", "member", "owner")).toBe(false);
    expect(canManageRole("owner", "owner", "admin")).toBe(true);
    expect(canManageRole("member", "viewer", "member")).toBe(false);
  });
});
