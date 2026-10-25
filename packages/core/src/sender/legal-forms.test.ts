import { describe, expect, it } from "vitest";
import {
  designationHints,
  directorsRole,
  hasCorporatePartner,
  hasLegalFormDesignation,
  imprintParts,
  isSenderProfileComplete,
  legalForms,
  legalFormsFor,
  optionalSenderFields,
  requiredSenderFields,
  type SenderProfileData,
  validateSenderProfile,
} from "./legal-forms";

const de = { kind: "business", country: "DE" } as const;
const at = { kind: "business", country: "AT" } as const;
const ch = { kind: "business", country: "CH" } as const;

const gmbh: SenderProfileData = {
  legalForm: "gmbh",
  companyName: "Bäckerei Huber GmbH",
  address: { street: "Hauptstraße 1", postalCode: "80331", city: "München", country: "DE" },
  seat: "München",
  registerCourt: "Amtsgericht München",
  registerNumber: "HRB 123456",
  managingDirectors: "Anna Huber, Max Huber",
};

describe("required sender fields per legal form", () => {
  it("asks a GmbH for register and managing directors (§ 35a GmbHG)", () => {
    expect(requiredSenderFields("gmbh", de)).toEqual([
      "companyName",
      "street",
      "postalCode",
      "city",
      "seat",
      "registerCourt",
      "registerNumber",
      "managingDirectors",
    ]);
  });

  it("asks a German AG for the supervisory board chair, an eG only if it has a board", () => {
    expect(requiredSenderFields("ag", de)).toContain("supervisoryBoardChair");
    // A small eG may do without a supervisory board (§ 9 GenG): offered, not mandatory.
    expect(requiredSenderFields("eg", de)).not.toContain("supervisoryBoardChair");
    expect(optionalSenderFields("eg", de)).toContain("supervisoryBoardChair");
    expect(requiredSenderFields("gmbh", de)).not.toContain("supervisoryBoardChair");
  });

  it("never asks Swiss companies for a supervisory board, they have none", () => {
    for (const form of ["ag", "eg", "gmbh"] as const) {
      expect(requiredSenderFields(form, ch)).not.toContain("supervisoryBoardChair");
      expect(optionalSenderFields(form, ch)).not.toContain("supervisoryBoardChair");
    }
    expect(directorsRole("ag", "CH")).toBe("boardOfDirectors");
    expect(directorsRole("eg", "CH")).toBe("administration");
    expect(directorsRole("ag", "DE")).toBe("board");
  });

  it("asks registered partnerships for the register but not for directors", () => {
    for (const form of ["ek", "ohg", "kg", "partg"] as const) {
      const fields = requiredSenderFields(form, de);
      expect(fields).toContain("registerNumber");
      expect(fields).toContain("seat");
      expect(fields).not.toContain("managingDirectors");
    }
    expect(requiredSenderFields("gmbh_co_kg", de)).toContain("managingDirectors");
  });

  it("asks a GmbH & Co. KG for the details of its general partner (§§ 125, 177a HGB)", () => {
    expect(requiredSenderFields("gmbh_co_kg", de)).toEqual(
      expect.arrayContaining([
        "generalPartnerName",
        "generalPartnerSeat",
        "generalPartnerRegisterCourt",
        "generalPartnerRegisterNumber",
        "managingDirectors",
      ]),
    );
    expect(requiredSenderFields("kg", de)).not.toContain("generalPartnerName");
  });

  it("asks sole traders and private workspaces only for name and address", () => {
    expect(requiredSenderFields("einzelunternehmen", de)).toEqual([
      "companyName",
      "street",
      "postalCode",
      "city",
    ]);
    expect(requiredSenderFields(null, { kind: "private", country: "DE" })).toEqual(["companyName"]);
  });

  it("offers register and representatives to other legal forms (SE, KGaA, Stiftung …)", () => {
    expect(requiredSenderFields("other", de)).not.toContain("registerNumber");
    expect(optionalSenderFields("other", de)).toEqual(
      expect.arrayContaining(["seat", "registerCourt", "registerNumber", "managingDirectors"]),
    );
    expect(directorsRole("other")).toBe("representatives");
  });

  it("offers only the legal forms that exist in a country", () => {
    expect(legalFormsFor("DE")).toEqual([...legalForms]);
    expect(legalFormsFor("AT")).not.toContain("ug");
    expect(legalFormsFor("AT")).not.toContain("partg");
    expect(legalFormsFor("CH")).not.toContain("gmbh_co_kg");
    expect(legalFormsFor("CH")).toContain("ag");
    // A Swiss association or sole proprietorship may be registered, it need not be.
    expect(requiredSenderFields("ev", ch)).not.toContain("registerNumber");
    expect(optionalSenderFields("ev", ch)).toContain("registerNumber");
  });

  it("covers every legal form", () => {
    for (const form of legalForms) {
      expect(requiredSenderFields(form, de)).toContain("companyName");
    }
  });
});

describe("sender profile validation", () => {
  it("accepts a complete GmbH profile", () => {
    const result = validateSenderProfile(gmbh, de);
    expect(result.ok).toBe(true);
    expect(isSenderProfileComplete(gmbh, de)).toBe(true);
    expect(isSenderProfileComplete({ ...gmbh, seat: null }, de)).toBe(false);
  });

  it("names every missing mandatory field", () => {
    const result = validateSenderProfile(
      { ...gmbh, registerNumber: "", managingDirectors: "   " },
      de,
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
    const result = validateSenderProfile({ ...gmbh, legalForm: null }, de);
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
      de,
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
      at,
    );
    expect(austria.ok).toBe(true);

    const swiss = validateSenderProfile(
      {
        ...gmbh,
        address: { street: "Bahnhofstrasse 1", postalCode: "8001", city: "Zürich", country: "CH" },
        companyName: "Bäckerei Huber AG",
        legalForm: "ag",
        registerCourt: "Handelsregisteramt Zürich",
        registerNumber: "CHE-123.456.789",
        vatId: "CHE-123.456.789 MWST",
      },
      ch,
    );
    expect(swiss.ok).toBe(true);
  });

  it("trims values and drops empty optional fields", () => {
    const result = validateSenderProfile(
      { ...gmbh, companyName: "  Bäckerei Huber GmbH  ", phone: "  ", vatId: "de 123 456 789" },
      de,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.companyName).toBe("Bäckerei Huber GmbH");
    expect(result.value.phone).toBeNull();
    expect(result.value.vatId).toBe("DE123456789");
  });

  it("ignores fields the chosen legal form does not offer", () => {
    const result = validateSenderProfile(
      {
        legalForm: "einzelunternehmen",
        companyName: "Malerei Schmid",
        address: { street: "Dorfstraße 3", postalCode: "83022", city: "Rosenheim" },
        // left over from a previously selected GmbH, partly invalid
        registerCourt: "Amtsgericht München",
        registerNumber: "HRB",
        managingDirectors: "Anna Huber",
        supervisoryBoardChair: "Max Muster",
        generalPartner: { name: "Verwaltungs GmbH" },
      },
      de,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.registerCourt).toBeNull();
    expect(result.value.registerNumber).toBeNull();
    expect(result.value.managingDirectors).toBeNull();
    expect(result.value.supervisoryBoardChair).toBeNull();
    expect(result.value.generalPartner).toBeNull();
  });

  it("validates and stores the general partner of a GmbH & Co. KG", () => {
    const base = {
      ...gmbh,
      legalForm: "gmbh_co_kg",
      companyName: "Huber Bau GmbH & Co. KG",
      registerNumber: "HRA 98765",
      managingDirectors: "Anna Huber",
    };
    const missing = validateSenderProfile(base, de);
    expect(!missing.ok && missing.error.fields).toEqual({
      generalPartnerName: "required",
      generalPartnerSeat: "required",
      generalPartnerRegisterCourt: "required",
      generalPartnerRegisterNumber: "required",
    });
    const complete = validateSenderProfile(
      {
        ...base,
        generalPartner: {
          name: "Huber Verwaltungs GmbH",
          seat: "München",
          registerCourt: "Amtsgericht München",
          registerNumber: "HRB 4711",
        },
      },
      de,
    );
    expect(complete.ok && complete.value.generalPartner).toEqual({
      name: "Huber Verwaltungs GmbH",
      seat: "München",
      registerCourt: "Amtsgericht München",
      registerNumber: "HRB 4711",
    });
  });

  it("recognises the designations registers actually use", () => {
    const accepted: Array<[string, Parameters<typeof hasLegalFormDesignation>[1], string]> = [
      ["Bäckerei Huber GmbH", "gmbh", "DE"],
      ["Gesellschaft für Bau mbH", "gmbh", "DE"],
      ["Huber gGmbH", "gmbh", "DE"],
      ["Huber UG (haftungsbeschränkt)", "ug", "DE"],
      ["Huber gUG (haftungsbeschränkt)", "ug", "DE"],
      ["Malerei Schmid e.K.", "ek", "DE"],
      ["Malerei Schmid e. Kfr.", "ek", "DE"],
      ["Huber Bau GmbH & Co. KG", "gmbh_co_kg", "DE"],
      ["Huber GmbH u. Co. KG", "gmbh_co_kg", "DE"],
      ["TRUMPF SE + Co. KG", "gmbh_co_kg", "DE"],
      ["Huber GmbH & Cie. KG", "gmbh_co_kg", "DE"],
      ["Huber UG (haftungsbeschränkt) & Co. KG", "gmbh_co_kg", "DE"],
      ["Huber GmbH & Co. Kommanditgesellschaft", "gmbh_co_kg", "DE"],
      ["Huber Verwaltungs GmbH & Co KG", "gmbh_co_kg", "AT"],
      ["Huber und Partner mbB", "partg", "DE"],
      ["Huber PartG mbB", "partg", "DE"],
      ["Müller Rechtsanwälte PartGmbB", "partg", "DE"],
      ["Gleiss Lutz Hootz Hirsch PartmbB", "partg", "DE"],
      ["Huber Rechtsanwälte Part mbB", "partg", "DE"],
      ["Wohnbau Musterstadt eG", "eg", "DE"],
      ["Wohnbau Musterstadt e.G.", "eg", "DE"],
      ["Sportverein Musterdorf e. V.", "ev", "DE"],
      ["Malerei Schmid e.U.", "ek", "AT"],
      ["Malerei Schmid eingetragene Unternehmerin", "ek", "AT"],
      ["Raiffeisenbank Musterdorf e. Gen.", "eg", "AT"],
      ["Verwaltungsgenossenschaft GÄRTNERBANK e.Gen.", "eg", "AT"],
      ["Huber & Partner OG", "ohg", "AT"],
      ["Bundesimmobiliengesellschaft m.b.H.", "gmbh", "AT"],
      ["Huber GesmbH", "gmbh", "AT"],
      ["Huber Ges.m.b.H.", "gmbh", "AT"],
      ["Muster SA", "ag", "CH"],
      ["Muster S.A.", "ag", "CH"],
      ["Muster S.à r.l.", "gmbh", "CH"],
      ["Muster Sagl", "gmbh", "CH"],
      ["Cooperativa agricola Ticino", "eg", "CH"],
      ["Società cooperativa Esempio", "eg", "CH"],
      ["Coopérative Exemple", "eg", "CH"],
      ["Esempio società anonima", "ag", "CH"],
      ["Exemple société anonyme", "ag", "CH"],
      ["Exemple société à responsabilité limitée", "gmbh", "CH"],
      ["Esempio società a garanzia limitata", "gmbh", "CH"],
      ["Huber & Söhne Kollektivgesellschaft", "ohg", "CH"],
      ["Huber KmG", "kg", "CH"],
    ];
    for (const [name, form, country] of accepted) {
      expect(hasLegalFormDesignation(name, form, country), `${name} (${form}, ${country})`).toBe(
        true,
      );
    }
    expect(hasLegalFormDesignation("Huber UG", "ug", "DE")).toBe(false);
    expect(hasLegalFormDesignation("Huber Beratung", "partg", "DE")).toBe(false);
    // „& Co. KG“ alone does not show the limited liability (§ 19 Abs. 2 HGB).
    expect(hasLegalFormDesignation("Huber & Co. KG", "gmbh_co_kg", "DE")).toBe(false);
    // Forms without a designation, and countries without patterns, always pass.
    expect(hasLegalFormDesignation("Malerei Schmid", "einzelunternehmen", "DE")).toBe(true);
    expect(hasLegalFormDesignation("Muster B.V.", "gmbh", "NL")).toBe(true);
  });

  it("only hints at a missing designation, saving still works", () => {
    const plain = { ...gmbh, companyName: "Bäckerei Huber" };
    expect(validateSenderProfile(plain, de).ok).toBe(true);
    expect(designationHints(plain, de)).toEqual(["companyName"]);
    expect(designationHints(gmbh, de)).toEqual([]);
    expect(designationHints({ ...plain, address: { ...gmbh.address, country: "LU" } }, de)).toEqual(
      [],
    );
    // The details then name the legal form in a line of their own.
    expect(imprintParts(plain).map((part) => part.key)).toContain("legalForm");
    expect(imprintParts(gmbh).map((part) => part.key)).not.toContain("legalForm");
    expect(imprintParts(plain).find((part) => part.key === "legalForm")?.values).toEqual({
      form: "gmbh",
      law: "DE",
    });
  });

  it("sends a KG with a liable corporation to the legal form „GmbH & Co. KG“", () => {
    for (const name of [
      "Huber Verwaltungs GmbH & Co. KG",
      "Stihl AG & Co. KG",
      "Huber Bau Ges.m.b.H. & Co KG",
      "Huber GesmbH & Co KG",
      "Huber Gesellschaft m.b.H. & Co KG",
      "Huber Aktiengesellschaft & Co. KG",
      "Huber Gesellschaft mit beschränkter Haftung & Co. KG",
      "Huber Unternehmergesellschaft (haftungsbeschränkt) & Co. KG",
      "Blitz 06-123 S.à r.l. & Co. KG",
      "Huber B.V. & Co. KG",
      "Huber Inc. & Co. KG",
    ]) {
      expect(hasCorporatePartner(name), name).toBe(true);
    }
    expect(hasCorporatePartner("Huber & Co. KG")).toBe(false);
    expect(hasCorporatePartner("Henkel AG & Co. KGaA")).toBe(false);
    const result = validateSenderProfile(
      { ...gmbh, legalForm: "kg", companyName: "Huber Verwaltungs GmbH & Co. KG" },
      de,
    );
    expect(!result.ok && result.error.fields).toEqual({ legalForm: "corporatePartner" });
    const natural = validateSenderProfile(
      { ...gmbh, legalForm: "kg", companyName: "Huber KG" },
      de,
    );
    expect(natural.ok).toBe(true);
    const austrian = validateSenderProfile(
      {
        ...gmbh,
        legalForm: "kg",
        companyName: "Huber Bau Ges.m.b.H. & Co KG",
        address: { street: "Ring 1", postalCode: "1010", city: "Wien", country: "AT" },
        registerCourt: "Handelsgericht Wien",
        registerNumber: "FN 123456a",
      },
      at,
    );
    expect(!austrian.ok && austrian.error.fields).toEqual({ legalForm: "corporatePartner" });
  });

  it("sends a „… GmbH & Co. KG“ chosen as another form to „GmbH & Co. KG“", () => {
    for (const legalForm of ["gmbh", "ag", "other", "einzelunternehmen", "gbr"]) {
      const result = validateSenderProfile(
        { ...gmbh, legalForm, companyName: "Huber Bau GmbH & Co. KG" },
        de,
      );
      expect(!result.ok && result.error.fields, legalForm).toMatchObject({
        legalForm: "corporatePartner",
      });
    }
  });

  it("sends a KGaA to „Andere Rechtsform“", () => {
    for (const legalForm of ["kg", "gmbh_co_kg"]) {
      const result = validateSenderProfile(
        { ...gmbh, legalForm, companyName: "Henkel AG & Co. KGaA" },
        de,
      );
      expect(!result.ok && result.error.fields, legalForm).toMatchObject({ legalForm: "kgaa" });
    }
  });

  it("recognises the general partner in every spelling of a corporation", () => {
    const base = { ...gmbh, legalForm: "gmbh_co_kg", companyName: "Huber Bau GmbH & Co. KG" };
    for (const name of [
      "Huber Verwaltungs Gesellschaft m.b.H.",
      "Huber Verwaltungs GesmbH",
      "Huber Verwaltungs Aktiengesellschaft",
      "Huber Verwaltungs Gesellschaft mit beschränkter Haftung",
      "Huber Holding B.V.",
    ]) {
      expect(designationHints({ ...base, generalPartner: { name } }, de), name).toEqual([]);
    }
    expect(designationHints({ ...base, generalPartner: { name: "Huber Verwaltung" } }, de)).toEqual(
      ["generalPartnerName"],
    );
  });

  it("asks for the supervisory board of the general partner and of other forms (SE, KGaA)", () => {
    expect(optionalSenderFields("gmbh_co_kg", de)).toContain("supervisoryBoardChair");
    expect(optionalSenderFields("other", de)).toContain("supervisoryBoardChair");
    const parts = imprintParts({
      ...gmbh,
      legalForm: "gmbh_co_kg",
      companyName: "Stihl AG & Co. KG",
      supervisoryBoardChair: "Otto Aufsicht",
    });
    expect(parts.map((part) => part.key)).toContain("generalPartnerSupervisoryBoard");
  });

  it("names the ZVR number of an Austrian association, the authority is optional", () => {
    const verein = {
      legalForm: "ev",
      companyName: "Musikverein Wien",
      address: { street: "Ring 1", postalCode: "1010", city: "Wien", country: "AT" },
      seat: "Wien",
      registerNumber: "123456789",
      managingDirectors: "Eva Muster",
    };
    expect(requiredSenderFields("ev", at)).not.toContain("registerCourt");
    expect(validateSenderProfile(verein, at).ok).toBe(true);
    expect(imprintParts(verein, at).find((part) => part.key === "zvr")?.values).toEqual({
      number: "123456789",
    });
    const withAuthority = { ...verein, registerCourt: "Landespolizeidirektion Wien" };
    expect(imprintParts(withAuthority, at).map((part) => part.key)).toContain("zvrWithAuthority");
  });

  it("takes an optional register completely or not at all", () => {
    const swiss = {
      legalForm: "ev",
      companyName: "Musikverein Zürich",
      address: { street: "Bahnhofstrasse 1", postalCode: "8001", city: "Zürich", country: "CH" },
      managingDirectors: "Eva Muster",
    };
    expect(validateSenderProfile(swiss, ch).ok).toBe(true);
    const half = validateSenderProfile({ ...swiss, registerNumber: "CHE-123.456.789" }, ch);
    expect(!half.ok && half.error.fields).toEqual({ registerCourt: "required" });
  });

  it("measures links after normalization", () => {
    const long = validateSenderProfile(
      { ...gmbh, privacyUrl: `beispiel.de/${"ü".repeat(400)}` },
      de,
    );
    expect(!long.ok && long.error.fields).toEqual({ privacyUrl: "tooLong" });
  });

  it("saves a normalized link again unchanged", () => {
    const first = validateSenderProfile(
      { ...gmbh, privacyUrl: `bäckerei-huber.de/datenschutzerklärung-${"ü".repeat(250)}` },
      de,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.privacyUrl?.length).toBeGreaterThan(300);
    const again = validateSenderProfile(first.value, de);
    expect(again.ok && again.value.privacyUrl).toBe(first.value.privacyUrl);
  });

  it("judges stored profiles by presence only, later stricter checks do not invalidate them", () => {
    const stored = {
      ...gmbh,
      companyName: "Bäckerei Huber",
      // normalized when saving, now longer than the input limit
      privacyUrl: `https://xn--bckerei-huber-6ib.de/${"d".repeat(320)}`,
    };
    expect(isSenderProfileComplete(stored, de)).toBe(true);
    expect(isSenderProfileComplete({ ...stored, seat: null }, de)).toBe(false);
    // A legal form that does not exist in the country of the address is never complete.
    const vienna = { street: "Ring 1", postalCode: "1010", city: "Wien", country: "AT" };
    expect(isSenderProfileComplete({ ...stored, legalForm: "ug", address: vienna }, at)).toBe(
      false,
    );
  });

  it("rejects a legal form that does not exist in the country of the address", () => {
    const result = validateSenderProfile(
      {
        ...gmbh,
        legalForm: "ug",
        companyName: "Huber UG (haftungsbeschränkt)",
        address: { street: "Ring 1", postalCode: "1010", city: "Wien", country: "AT" },
        registerCourt: "Handelsgericht Wien",
        registerNumber: "FN 123456a",
      },
      at,
    );
    expect(!result.ok && result.error.fields).toEqual({ legalForm: "invalid" });
  });

  it("limits field lengths", () => {
    const result = validateSenderProfile({ ...gmbh, companyName: "x".repeat(201) }, de);
    expect(!result.ok && result.error.fields).toEqual({ companyName: "tooLong" });
  });
});

describe("imprint parts (lines under every business mail and on the unsubscribe page)", () => {
  it("lists the mandatory details of an AG with roles", () => {
    const parts = imprintParts({
      ...gmbh,
      legalForm: "ag",
      companyName: "Muster AG",
      seat: "Grünwald",
      managingDirectors: "Eva Vorstand",
      supervisoryBoardChair: "Otto Aufsicht",
    });
    expect(parts.map((part) => part.key)).toEqual([
      "name",
      "address",
      "seat",
      "register",
      "board",
      "supervisoryBoard",
    ]);
    expect(parts.find((part) => part.key === "board")?.values).toEqual({ names: "Eva Vorstand" });
    // The registered seat, not the town of the address.
    expect(parts.find((part) => part.key === "seat")?.values).toEqual({ seat: "Grünwald" });
  });

  it("names the general partner of a GmbH & Co. KG and its management", () => {
    const parts = imprintParts({
      ...gmbh,
      legalForm: "gmbh_co_kg",
      companyName: "Huber Bau GmbH & Co. KG",
      generalPartner: {
        name: "Huber Verwaltungs GmbH",
        seat: "München",
        registerCourt: "Amtsgericht München",
        registerNumber: "HRB 4711",
      },
    });
    expect(parts.map((part) => part.key)).toContain("generalPartner");
    expect(parts.map((part) => part.key)).toContain("generalPartnerManagement");
  });

  it("shows only name and address for a sole trader, even with leftovers", () => {
    const parts = imprintParts({
      legalForm: "einzelunternehmen",
      companyName: "Malerei Schmid",
      address: { street: "Dorfstraße 3", postalCode: "83022", city: "Rosenheim" },
      registerNumber: "HRB 1",
      vatId: "DE123456789",
    });
    expect(parts.map((part) => part.key)).toEqual(["name", "address", "vatId"]);
  });
});
