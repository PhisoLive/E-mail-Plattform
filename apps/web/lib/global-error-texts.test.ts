import { describe, expect, it } from "vitest";
import catalog from "../messages/de.json";
import texts from "../messages/global-error.json";

describe("texts of the global error page", () => {
  it("are exactly the ones in de.json (pages.error)", () => {
    const { title, text, retry } = catalog.pages.error;
    expect(texts).toEqual({ title, text, retry });
  });
});
