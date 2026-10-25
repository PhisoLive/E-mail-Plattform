import { type ErrorCodeWithParams, type ErrorParams, errorCodes } from "@ep/core";
import { describe, expect, it } from "vitest";
import messages from "../messages/de.json";

/** Placeholders the UI fills from defaults.ts (use-error-message.ts). */
const fromDefaults = ["threshold", "mb"];
/** Must match ErrorParams in packages/core/src/errors.ts. */
const serverParams: { [C in ErrorCodeWithParams]: Array<keyof ErrorParams[C]> } = {
  PREFLIGHT_PLACEHOLDER: ["anzahl"],
  SEND_UNVERIFIED: ["anzahl"],
  PLAN_LIMIT: ["limit"],
};

/** Top-level ICU arguments of a message (`{name}`, `{name, plural, …}`). */
function argumentsOf(message: string): string[] {
  const names = new Set<string>();
  let depth = 0;
  for (let index = 0; index < message.length; index += 1) {
    const char = message[index];
    if (char === "{") {
      if (depth === 0) {
        const match = /^\{\s*(\w+)/.exec(message.slice(index));
        if (match?.[1]) names.add(match[1]);
      }
      depth += 1;
    } else if (char === "}") depth -= 1;
  }
  return [...names].sort();
}

describe("error texts (concept Anhang D)", () => {
  const errors = messages.errors as Record<string, string>;

  it("exist for every error code", () => {
    expect(errorCodes.filter((code) => !(code in errors))).toEqual([]);
  });

  it("use exactly the values the server sends or the UI fills from defaults.ts", () => {
    for (const code of errorCodes) {
      const expected = [
        ...((serverParams as Record<string, string[]>)[code] ?? []),
        ...argumentsOf(errors[code] ?? "").filter((name) => fromDefaults.includes(name)),
      ].sort();
      expect(argumentsOf(errors[code] ?? ""), code).toEqual(expected);
    }
  });
});
