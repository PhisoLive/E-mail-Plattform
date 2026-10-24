import { describe, expect, it } from "vitest";
import {
  isSenderProfileComplete,
  legalForms,
  requiredSenderFields,
  type SenderProfileData,
  validateSenderProfile,
} from "./legal-forms";

const gmbh: SenderProfileData = {
  legalForm: "gmbh",
  companyName: "Bäckerei Huber GmbH",
  address: { street: "Hauptstraße 1", postalCode: "80331", city: "München", country: "DE" },
  registerCourt: "Amtsgericht München",
  registerNumber: "HRB 123456",
  managingDirectors: "Anna Huber, Max Huber",
};

describe("required sender fields per legal form", () => {
  it("asks a GmbH for register and managing directors (§ 35a GmbHG)", () => {
    expect(requiredSenderFields("gmbh", "business")).toEqual([
      "companyName",
      "street",
      "postalCode",
      "city",
      "registerCourt",
      "registerNumber",
      "managingDirectors",
    ]);
  });

  it("asks an AG and an eG additionally for the supervisory board chair", () => {
    expect(requiredSenderFields("ag", "business")).toContain("supervisoryBoardChair");
    expect(requiredSenderFields("eg", "business")).toContain("supervisoryBoardChair");
    expect(requiredSenderFields("gmbh", "business")).not.toContain("supervisoryBoardChair");
  });

  it("asks registered partnerships for the register but not for directors", () => {
    for (const form of ["ek", "ohg", "kg", "partg"] as const) {
      const fields = requiredSenderFields(form, "business");
      expect(fields).toContain("registerNumber");
      expect(fields).not.toContain("managingDirectors");
    }
    expect(requiredSenderFields("gmbh_co_kg", "business")).toContain("managingDirectors");
  });

  it("asks sole traders and private workspaces only for name and address", () => {
    expect(requiredSenderFields("einzelunternehmen", "business")).toEqual([
      "companyName",
      "street",
      "postalCode",
      "city",
    ]);
    expect(requiredSenderFields(null, "private")).toEqual(["companyName"]);
  });

  it("covers every legal form", () => {
    for (const form of legalForms) {
      expect(requiredSenderFields(form, "business")).toContain("companyName");
    }
  });
});

describe("sender profile validation", () => {
  it("accepts a complete GmbH profile", () => {
    const result = validateSenderProfile(gmbh, { kind: "business", country: "DE" });
    expect(result.ok).toBe(true);
    expect(isSenderProfileComplete(gmbh, "business")).toBe(true);
  });

  it("names every missing mandatory field", () => {
    const result = validateSenderProfile(
      { ...gmbh, registerNumber: "", managingDirectors: "   " },
      { kind: "business", country: "DE" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION");
    expect(result.error.fields).toEqual({
      registerNumber: "required",
      managingDirectors: "required",
    });
  });

  it("requires a legal form for business workspaces", () => {
    const result = validateSenderProfile(
      { ...gmbh, legalForm: null },
      { kind: "business", country: "DE" },
    );
    expect(!result.ok && result.error.fields).toEqual({ legalForm: "required" });
  });

  it("checks postal codes, VAT IDs, register numbers and links by country", () => {
    const result = validateSenderProfile(
      {
        ...gmbh,
        address: { ...gmbh.address, postalCode: "8033" },
        registerNumber: "HRB",
        vatId: "DE12345",
        website: "javascript:alert(1)",
        privacyUrl: "http://beispiel.de/datenschutz",
        phone: "089 / 123 456",
      },
      { kind: "business", country: "DE" },
    );
    expect(!result.ok && result.error.fields).toEqual({
      postalCode: "invalid",
      registerNumber: "invalid",
      vatId: "invalid",
      website: "invalid",
    });

    const austria = validateSenderProfile(
      {
        ...gmbh,
        address: { street: "Ring 1", postalCode: "1010", city: "Wien", country: "AT" },
        registerCourt: "Handelsgericht Wien",
        registerNumber: "FN 123456a",
        vatId: "ATU12345678",
      },
      { kind: "business", country: "AT" },
    );
    expect(austria.ok).toBe(true);

    const swiss = validateSenderProfile(
      {
        ...gmbh,
        address: { street: "Bahnhofstrasse 1", postalCode: "8001", city: "Zürich", country: "CH" },
        registerCourt: "Handelsregisteramt Zürich",
        registerNumber: "CHE-123.456.789",
        vatId: "CHE-123.456.789 MWST",
      },
      { kind: "business", country: "CH" },
    );
    expect(swiss.ok).toBe(true);
  });

  it("trims values and drops empty optional fields", () => {
    const result = validateSenderProfile(
      { ...gmbh, companyName: "  Bäckerei Huber GmbH  ", phone: "  ", vatId: "de 123 456 789" },
      { kind: "business", country: "DE" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.companyName).toBe("Bäckerei Huber GmbH");
    expect(result.value.phone).toBeNull();
    expect(result.value.vatId).toBe("DE123456789");
  });

  it("limits field lengths", () => {
    const result = validateSenderProfile(
      { ...gmbh, companyName: "x".repeat(201) },
      { kind: "business", country: "DE" },
    );
    expect(!result.ok && result.error.fields).toEqual({ companyName: "tooLong" });
  });
});
