import { addTestMember, createTestDeps, createTestWorkspace } from "@ep/testing";
import { describe, expect, it } from "vitest";
import { getOnboardingStatus } from "./onboarding";
import { updateSenderProfile } from "./sender-profile";

const deps = createTestDeps();

describe("onboarding status", () => {
  it("starts with only the workspace step done", async () => {
    const workspace = await createTestWorkspace(deps);
    const status = await getOnboardingStatus(workspace.ownerCtx);
    expect(status).toEqual({
      ok: true,
      value: {
        steps: {
          workspace: true,
          mailbox: false,
          senderProfile: false,
          agent: false,
          campaign: false,
        },
        done: 1,
        total: 5,
      },
    });
  });

  it("marks the sender profile once the mandatory details are saved", async () => {
    const workspace = await createTestWorkspace(deps);
    await updateSenderProfile(workspace.ownerCtx, {
      legalForm: "einzelunternehmen",
      companyName: "Malerei Schmid",
      address: { street: "Dorfstraße 3", postalCode: "83022", city: "Rosenheim" },
    });
    const status = await getOnboardingStatus(workspace.ownerCtx);
    expect(status.ok && status.value.steps.senderProfile).toBe(true);
    expect(status.ok && status.value.done).toBe(2);
  });

  it("reads only the own workspace", async () => {
    const a = await createTestWorkspace(deps);
    const b = await createTestWorkspace(deps);
    await updateSenderProfile(a.ownerCtx, {
      legalForm: "einzelunternehmen",
      companyName: "A",
      address: { street: "Weg 1", postalCode: "80331", city: "München" },
    });
    const statusB = await getOnboardingStatus(b.ownerCtx);
    expect(statusB.ok && statusB.value.steps.senderProfile).toBe(false);
    const viewer = await addTestMember(deps, a, "viewer");
    expect((await getOnboardingStatus(viewer.ctx)).ok).toBe(true);
  });
});
