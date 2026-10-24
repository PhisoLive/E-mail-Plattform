import { describe, expect, it } from "vitest";
import { defaults } from "./defaults";

describe("defaults", () => {
  it("contains the start values from concept chapter 25", () => {
    expect(defaults.scheduler.tickSeconds).toBe(15);
    expect(defaults.sending.undoSeconds).toBe(10);
    expect(defaults.agent.approvalThreshold).toBe(25);
    expect(defaults.approval.expiresHours).toBe(72);
    expect(defaults.provider.capUsagePercent).toBe(0.8);
    expect(defaults.ramp.profiles.newCold).toEqual({
      start: 5,
      increasePerBusinessDay: 3,
      target: 40,
    });
  });

  it("has health weights summing to 1", () => {
    const sum = Object.values(defaults.health.weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});
