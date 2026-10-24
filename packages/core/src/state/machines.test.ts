import { describe, expect, it } from "vitest";
import { canTransition, isFinalState, machines } from "./machines";

describe("state machines (concept chapter 4)", () => {
  it("allows the documented outbound message path", () => {
    expect(canTransition("message", "draft", "scheduled")).toBe(true);
    expect(canTransition("message", "scheduled", "queued")).toBe(true);
    expect(canTransition("message", "queued", "sending")).toBe(true);
    expect(canTransition("message", "sending", "uncertain")).toBe(true);
    expect(canTransition("message", "uncertain", "sent")).toBe(true);
  });

  it("never allows sending again from a final state", () => {
    for (const state of ["sent", "failed", "skipped", "cancelled"] as const) {
      expect(isFinalState("message", state)).toBe(true);
      expect(canTransition("message", state, "queued")).toBe(false);
    }
    expect(canTransition("message", "scheduled", "sending")).toBe(false);
  });

  it("knows the sending-ready mailbox states", () => {
    expect(canTransition("mailbox", "active", "needs_reauth")).toBe(true);
    expect(canTransition("mailbox", "needs_reauth", "active")).toBe(true);
    expect(canTransition("mailbox", "disconnected", "active")).toBe(false);
  });

  it("only references defined states", () => {
    for (const machine of Object.values(machines)) {
      const states = new Set(Object.keys(machine));
      for (const targets of Object.values(machine) as readonly (readonly string[])[]) {
        for (const target of targets) expect(states.has(target)).toBe(true);
      }
    }
  });
});
