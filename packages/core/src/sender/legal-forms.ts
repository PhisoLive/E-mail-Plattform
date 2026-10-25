import { type AppError, appError } from "../errors";
import { err, ok, type Result } from "../result";

/**
 * Mandatory details for business e-mails per legal form and country (concept chapters 7, 8, 17):
 * Germany § 37a HGB (e.K.), §§ 125, 177a HGB (OHG, KG, GmbH & Co. KG with the details of the
 * general partner; § 125a HGB before the MoPeG of 01.01.2024), § 35a GmbHG, § 80 AktG,
 * § 25a GenG, § 7 Abs. 5 PartGG; Austria § 14 UGB (Firmenbuch) and the ZVR number of
 * associations; Switzerland Art. 954a OR (firm name as registered, UID). Other countries follow
 * the German rules, the strictest of the three. The texts for the form live in de.json.
 */
export const legalForms = [
  "einzelunternehmen",
  "freiberufler",
  "gbr",
  "ek",
  "ohg",
  "kg",
  "gmbh_co_kg",
  "gmbh",
  "ug",
  "ag",
  "eg",
  "ev",
  "partg",
  "other",
] as const;
export type LegalForm = (typeof legalForms)[number];

export type WorkspaceKind = "business" | "private";
export type WorkspaceCountry = "DE" | "AT" | "CH" | "other";
/** Legal system whose rules apply; decided by the country of the sender address. */
export type Jurisdiction = "DE" | "AT" | "CH";

/** Who sends and under which law: workspace kind plus the country of the sender address. */
export interface SenderContext {
  kind: WorkspaceKind;
  country: string;
}

export function jurisdiction(country: string | null | undefined): Jurisdiction {
  return country === "AT" || country === "CH" ? country : "DE";
}

export type SenderField =
  | "legalForm"
  | "companyName"
  | "street"
  | "postalCode"
  | "city"
  | "country"
  | "seat"
  | "registerCourt"
  | "registerNumber"
  | "managingDirectors"
  | "supervisoryBoardChair"
  | "generalPartnerName"
  | "generalPartnerSeat"
  | "generalPartnerRegisterCourt"
  | "generalPartnerRegisterNumber"
  | "vatId"
  | "phone"
  | "website"
  | "privacyUrl";

/**
 * `corporatePartner`: a KG or OHG whose name shows a liable corporation („… GmbH & Co. KG“) –
 * it needs the legal form „GmbH & Co. KG“ with the details of that partner.
 */
export type SenderFieldError = "required" | "invalid" | "tooLong" | "corporatePartner" | "kgaa";

export interface SenderAddress {
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}

/** General partner of a GmbH & Co. KG (§ 125 Abs. 1 S. 2, § 177a HGB). */
export interface GeneralPartner {
  name?: string | null;
  seat?: string | null;
  registerCourt?: string | null;
  registerNumber?: string | null;
}

/** Input as it comes from the form or the database. */
export interface SenderProfileData {
  legalForm?: string | null;
  companyName?: string | null;
  address?: SenderAddress | null;
  /** Registered seat; may differ from the business address (§ 4a GmbHG, § 5 AktG). */
  seat?: string | null;
  registerCourt?: string | null;
  registerNumber?: string | null;
  managingDirectors?: string | null;
  supervisoryBoardChair?: string | null;
  generalPartner?: GeneralPartner | null;
  vatId?: string | null;
  phone?: string | null;
  website?: string | null;
  privacyUrl?: string | null;
}

export interface NormalizedSenderProfile {
  legalForm: LegalForm | null;
  companyName: string | null;
  address: {
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
  };
  seat: string | null;
  registerCourt: string | null;
  registerNumber: string | null;
  managingDirectors: string | null;
  supervisoryBoardChair: string | null;
  generalPartner: {
    name: string;
    seat: string;
    registerCourt: string;
    registerNumber: string;
  } | null;
  vatId: string | null;
  phone: string | null;
  website: string | null;
  privacyUrl: string | null;
}

/** Legal forms that do not exist in a country (e.g. no UG or PartG in Austria). */
const unavailable: Record<Jurisdiction, readonly LegalForm[]> = {
  DE: [],
  AT: ["ug", "partg"],
  CH: ["ek", "gmbh_co_kg", "ug", "partg"],
};

/** Forms entered in a register: register, seat and the firm name with its designation. */
const registered: Record<Jurisdiction, readonly LegalForm[]> = {
  DE: ["ek", "ohg", "kg", "gmbh_co_kg", "gmbh", "ug", "ag", "eg", "ev", "partg"],
  AT: ["ek", "ohg", "kg", "gmbh_co_kg", "gmbh", "ag", "eg", "ev"],
  CH: ["ohg", "kg", "gmbh", "ag", "eg"],
};
/** Forms that may be registered: the register fields are offered, but not mandatory. */
const optionallyRegistered: Record<Jurisdiction, readonly LegalForm[]> = {
  DE: ["other"],
  AT: ["other"],
  CH: ["einzelunternehmen", "ev", "other"],
};
const withDirectors: readonly LegalForm[] = ["gbr", "gmbh_co_kg", "gmbh", "ug", "ag", "eg", "ev"];
/** The chair of the supervisory board is mandatory only for a German AG (§ 80 AktG). */
const withSupervisoryBoard: Record<Jurisdiction, readonly LegalForm[]> = {
  DE: ["ag"],
  AT: [],
  CH: [],
};
/**
 * A supervisory board is optional for these forms (a small eG may do without one, § 9 GenG);
 * if there is one, its chair belongs to the details – for a GmbH & Co. KG the board of the
 * general partner (an AG or SE always has one), for „other“ e.g. an SE or KGaA (§ 80 AktG).
 * Swiss companies have no such body.
 */
const withOptionalSupervisoryBoard: Record<Jurisdiction, readonly LegalForm[]> = {
  DE: ["gmbh", "ug", "eg", "gmbh_co_kg", "other"],
  AT: ["gmbh", "ag", "eg", "gmbh_co_kg", "other"],
  CH: [],
};
const generalPartnerFields: readonly SenderField[] = [
  "generalPartnerName",
  "generalPartnerSeat",
  "generalPartnerRegisterCourt",
  "generalPartnerRegisterNumber",
];

/**
 * A corporation – liable partner in front of „& Co.“ or general partner of a GmbH & Co. KG:
 * GmbH in all its spellings (mbH, m.b.H., GesmbH, Ges.m.b.H., written out), UG, AG, SE,
 * foreign ones (Ltd., Limited, Inc., LLC, B.V., S.à r.l., S.A.), foundations and cooperatives.
 */
const corporation =
  "(gmbh|\\bm\\.?\\s?b\\.?\\s?h\\b\\.?|\\bges\\.?\\s?m\\.?\\s?b\\.?\\s?h\\b\\.?|gesellschaft\\s+mit\\s+beschränkter\\s+haftung|\\bg?ug\\b(\\s*\\(haftungsbeschränkt\\))?|unternehmergesellschaft(\\s*\\(haftungsbeschränkt\\))?|\\bag\\b|aktiengesellschaft|\\bse\\b|\\bltd\\b\\.?|\\blimited\\b|\\binc\\b\\.?|\\bllc\\b|\\bb\\.\\s?v\\.?|\\bbv\\b|\\bs\\.?\\s?[àa]\\.?\\s?r\\.?\\s?l\\b\\.?|\\bs\\.\\s?a\\.?|\\bsa\\b|stiftung|\\beg\\b)";
const corporationPattern = new RegExp(corporation, "i");
/** A KGaA is a legal form of its own („Andere Rechtsform“), not a GmbH & Co. KG. */
const kgaaPattern = /\bkgaa\b|kommanditgesellschaft\s+auf\s+aktien/i;
const andCo = "\\s*(&|\\+|\\bund\\b|\\bu\\.)\\s*(co|cie)\\b\\.?";
const corporatePartnerPattern = new RegExp(`${corporation}${andCo}`, "i");
const gmbhCoKg = new RegExp(
  `${corporation}${andCo}\\s*(kg|ohg|og|kommanditgesellschaft|offene\\s+(handels)?gesellschaft)\\b`,
  "i",
);
const kgDe = /\bkg\b|kommanditgesellschaft/i;
/** GmbH, mbH, m.b.H., GesmbH, Ges.m.b.H. (the Austrian Firmenbuch knows all of them). */
const gmbhDe =
  /gmbh|\bm\.?\s?b\.?\s?h\b\.?|\bges\.?\s?m\.?\s?b\.?\s?h\b|gesellschaft\s+mit\s+beschränkter\s+haftung/i;
const agDe = /\bag\b|aktiengesellschaft/i;

/**
 * Designation of the legal form a registered firm name carries (§ 19 HGB, §§ 4, 5a GmbHG, § 4
 * AktG, § 3 GenG, § 65 BGB, §§ 2, 8 PartGG; § 19 UGB, § 6 GenG AT; Art. 950 OR, Art. 116a HRegV).
 * A name without a recognisable designation is not rejected – registers allow more spellings
 * than any pattern – the form shows a hint and the details name the legal form in a line of
 * their own (`imprintParts`).
 */
const designations: Partial<Record<LegalForm, Partial<Record<Jurisdiction, RegExp>>>> = {
  ek: {
    DE: /\be\.\s?(k|kfm|kfr)\.|eingetragene[rn]?\s+kauf(mann|frau)/i,
    AT: /\be\.\s?u\.|eingetragene[rn]?\s+unternehmer(in)?/i,
  },
  ohg: {
    DE: /\bohg\b|offene\s+handelsgesellschaft/i,
    AT: /\bog\b|offene\s+gesellschaft/i,
    CH: /kollektivgesellschaft|\bklg\b|\bsnc\b|soci[ée]t[ée]\s+en\s+nom\s+collectif|societ[àa]\s+in\s+nome\s+collettivo/i,
  },
  kg: {
    DE: kgDe,
    AT: kgDe,
    CH: /kommanditgesellschaft|\bkmg\b|\bscm\b|soci[ée]t[ée]\s+en\s+commandite|societ[àa]\s+in\s+accomandita/i,
  },
  gmbh_co_kg: { DE: gmbhCoKg, AT: gmbhCoKg },
  gmbh: {
    DE: gmbhDe,
    AT: gmbhDe,
    CH: /gmbh|\bs\.?\s?[àa]\.?\s?r\.?\s?l\b\.?|\bsagl\b|gesellschaft\s+mit\s+beschränkter\s+haftung|soci[ée]t[ée]\s+[àa]\s+responsabilit[ée]\s+limit[ée]e|societ[àa]\s+a\s+garanzia\s+limitata/i,
  },
  ug: { DE: /\bg?(ug|unternehmergesellschaft)\s*\(haftungsbeschränkt\)/i },
  ag: {
    DE: agDe,
    AT: agDe,
    CH: /\bag\b|\bs\.?\s?a\b\.?|aktiengesellschaft|soci[ée]t[ée]\s+anonyme|societ[àa]\s+anonima/i,
  },
  eg: {
    DE: /\beg\b|\be\.\s?g\.|eingetragene\s+genossenschaft/i,
    AT: /\be\.?\s?gen\b\.?|eingetragene\s+genossenschaft/i,
    CH: /genossenschaft|coop[ée]rative|cooperativa/i,
  },
  ev: { DE: /\be\.\s?v\.|eingetragener\s+verein/i },
  partg: {
    DE: /partnerschaft|\bpart(g)?\s?(mbb|gmbb)\b|\bpartg\b|(\bund\b|&|\+)\s*partner/i,
  },
};

/** Forms whose designation can be recognised, i.e. the legal forms of `imprintParts`' line. */
export type DesignatedForm =
  | "ek"
  | "ohg"
  | "kg"
  | "gmbh_co_kg"
  | "gmbh"
  | "ug"
  | "ag"
  | "eg"
  | "ev"
  | "partg";

/** Legal forms offered for a country, in display order. */
export function legalFormsFor(country: string | null | undefined): LegalForm[] {
  const missing = unavailable[jurisdiction(country)];
  return legalForms.filter((form) => !missing.includes(form));
}

/** How the people field is called for a legal form (label key in de.json). */
export function directorsRole(
  form: LegalForm | null,
  country: string | null | undefined = "DE",
):
  | "management"
  | "board"
  | "boardOfDirectors"
  | "administration"
  | "representatives"
  | "partners"
  | "generalPartnerManagement"
  | null {
  const swiss = jurisdiction(country) === "CH";
  if (form === "gbr") return "partners";
  if (form === "ag") return swiss ? "boardOfDirectors" : "board";
  if (form === "eg") return swiss ? "administration" : "board";
  if (form === "ev") return "board";
  if (form === "gmbh_co_kg") return "generalPartnerManagement";
  if (form === "gmbh" || form === "ug") return "management";
  if (form === "other") return "representatives";
  return null;
}

export function isLegalForm(value: unknown): value is LegalForm {
  return typeof value === "string" && (legalForms as readonly string[]).includes(value);
}

function has(list: readonly LegalForm[], form: LegalForm | null): boolean {
  return form !== null && list.includes(form);
}

/** Mandatory fields in display order. Private workspaces only need a sender name. */
export function requiredSenderFields(
  form: LegalForm | null,
  context: SenderContext,
): SenderField[] {
  if (context.kind === "private") return ["companyName"];
  const law = jurisdiction(context.country);
  const fields: SenderField[] = ["companyName", "street", "postalCode", "city"];
  // An Austrian association is identified by its ZVR number; the authority is optional.
  if (law === "AT" && form === "ev") fields.push("seat", "registerNumber");
  else if (has(registered[law], form)) fields.push("seat", "registerCourt", "registerNumber");
  if (form === "gmbh_co_kg") fields.push(...generalPartnerFields);
  if (has(withDirectors, form)) fields.push("managingDirectors");
  if (has(withSupervisoryBoard[law], form)) fields.push("supervisoryBoardChair");
  return fields;
}

/** Every field the form offers for a legal form; anything else is not stored. */
export function offeredSenderFields(form: LegalForm | null, context: SenderContext): SenderField[] {
  const law = jurisdiction(context.country);
  const fields = requiredSenderFields(form, context);
  const add = (field: SenderField) => {
    if (!fields.includes(field)) fields.push(field);
  };
  for (const field of ["street", "postalCode", "city"] as const) add(field);
  if (context.kind === "business" && law === "AT" && form === "ev") add("registerCourt");
  if (context.kind === "business") {
    if (has(optionallyRegistered[law], form)) {
      for (const field of ["seat", "registerCourt", "registerNumber"] as const) add(field);
    }
    if (form === "other") add("managingDirectors");
    if (has(withOptionalSupervisoryBoard[law], form)) add("supervisoryBoardChair");
  }
  for (const field of ["vatId", "phone", "website", "privacyUrl"] as const) add(field);
  return fields;
}

/** Optional fields that the form offers for a legal form. */
export function optionalSenderFields(
  form: LegalForm | null,
  context: SenderContext,
): SenderField[] {
  const required = requiredSenderFields(form, context);
  return offeredSenderFields(form, context).filter((field) => !required.includes(field));
}

/**
 * Does the firm name carry the designation of its legal form? True as well when there is no
 * pattern for the form or the country (other countries, sole traders, GbR …).
 */
export function hasLegalFormDesignation(
  name: string,
  form: LegalForm | null,
  country: string | null | undefined,
): boolean {
  const pattern = designationPattern(form, country);
  return pattern ? pattern.test(name) : true;
}

function designationPattern(
  form: LegalForm | null,
  country: string | null | undefined,
): RegExp | undefined {
  // Only for the three legal systems the patterns are written for.
  if (country !== "DE" && country !== "AT" && country !== "CH") return undefined;
  return form ? designations[form]?.[country] : undefined;
}

/** Does a name show a corporation as liable partner („Huber Verwaltungs GmbH & Co. KG“)? */
export function hasCorporatePartner(name: string): boolean {
  return corporatePartnerPattern.test(name) && !kgaaPattern.test(name);
}

/** Names that probably lack the designation of their legal form – shown as hints, never errors. */
export function designationHints(
  input: SenderProfileData,
  workspace: { kind: WorkspaceKind; country: WorkspaceCountry },
): Array<"companyName" | "generalPartnerName"> {
  if (workspace.kind !== "business") return [];
  const form = isLegalForm(input.legalForm) ? input.legalForm : null;
  const country = senderCountry(input, workspace.country);
  const hints: Array<"companyName" | "generalPartnerName"> = [];
  const name = clean(input.companyName);
  if (name && !hasLegalFormDesignation(name, form, country)) hints.push("companyName");
  const partner = clean(input.generalPartner?.name);
  if (form === "gmbh_co_kg" && partner && !corporationPattern.test(partner)) {
    hints.push("generalPartnerName");
  }
  return hints;
}

/** Country of the sender address, otherwise of the workspace (`other` counts as Germany). */
export function senderCountry(
  profile: SenderProfileData,
  workspaceCountry: WorkspaceCountry,
): string {
  return (
    clean(profile.address?.country)?.toUpperCase() ??
    (workspaceCountry === "other" ? "DE" : workspaceCountry)
  );
}

const maxLength: Partial<Record<SenderField, number>> = {
  companyName: 200,
  street: 200,
  postalCode: 12,
  city: 120,
  seat: 120,
  registerCourt: 120,
  registerNumber: 40,
  managingDirectors: 500,
  supervisoryBoardChair: 200,
  generalPartnerName: 200,
  generalPartnerSeat: 120,
  generalPartnerRegisterCourt: 120,
  generalPartnerRegisterNumber: 40,
  vatId: 30,
  phone: 30,
  // Measured after normalization (percent-encoding, punycode), so a stored link always saves
  // again unchanged.
  website: 2000,
  privacyUrl: 2000,
};

const postalCodes: Record<string, RegExp> = {
  DE: /^\d{5}$/,
  AT: /^\d{4}$/,
  CH: /^\d{4}$/,
};

const registerNumberPattern = /^(?=.*\d)[\p{L}\d .\-/]{2,40}$/u;

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeVatId(value: string): string | null {
  const compact = value.toUpperCase().replace(/\s+/g, "");
  if (/^DE\d{9}$/.test(compact) || /^ATU\d{8}$/.test(compact)) return compact;
  const swiss = compact.match(/^CHE-?(\d{3})\.?(\d{3})\.?(\d{3})(MWST|TVA|IVA)?$/);
  if (swiss) return `CHE-${swiss[1]}.${swiss[2]}.${swiss[3]}${swiss[4] ? ` ${swiss[4]}` : ""}`;
  if (/^(?!DE|AT|CH)[A-Z]{2}[A-Z0-9]{8,12}$/.test(compact)) return compact;
  return null;
}

function normalizeUrl(value: string): string | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

type ValueField = Exclude<SenderField, "legalForm" | "country">;

function rawValues(input: SenderProfileData): Record<ValueField, string | null> {
  return {
    companyName: clean(input.companyName),
    street: clean(input.address?.street),
    postalCode: clean(input.address?.postalCode),
    city: clean(input.address?.city),
    seat: clean(input.seat),
    registerCourt: clean(input.registerCourt),
    registerNumber: clean(input.registerNumber),
    managingDirectors: clean(input.managingDirectors),
    supervisoryBoardChair: clean(input.supervisoryBoardChair),
    generalPartnerName: clean(input.generalPartner?.name),
    generalPartnerSeat: clean(input.generalPartner?.seat),
    generalPartnerRegisterCourt: clean(input.generalPartner?.registerCourt),
    generalPartnerRegisterNumber: clean(input.generalPartner?.registerNumber),
    vatId: clean(input.vatId),
    phone: clean(input.phone),
    website: clean(input.website),
    privacyUrl: clean(input.privacyUrl),
  };
}

/** Values of the fields the legal form offers; left-overs of another legal form are dropped. */
function offeredValues(
  input: SenderProfileData,
  form: LegalForm | null,
  context: SenderContext,
): Record<ValueField, string | null> {
  const values = rawValues(input);
  const offered = offeredSenderFields(form, context);
  for (const field of Object.keys(values) as ValueField[]) {
    if (!offered.includes(field)) values[field] = null;
  }
  return values;
}

/**
 * Validates and normalizes a sender profile. All mandatory fields of the legal form must be
 * filled, the optional ones must have a valid format, fields the legal form does not offer are
 * dropped. Errors are reported per field.
 */
export function validateSenderProfile(
  input: SenderProfileData,
  workspace: { kind: WorkspaceKind; country: WorkspaceCountry },
): Result<NormalizedSenderProfile, AppError> {
  const fields: Partial<Record<SenderField, SenderFieldError>> = {};
  const legalForm = input.legalForm
    ? isLegalForm(input.legalForm)
      ? input.legalForm
      : undefined
    : null;
  const country = senderCountry(input, workspace.country);
  if (!/^[A-Z]{2}$/.test(country)) fields.country = "invalid";
  if (legalForm === undefined) fields.legalForm = "invalid";
  else if (legalForm === null && workspace.kind === "business") fields.legalForm = "required";
  // The form only offers the legal forms of the country; an Austrian UG cannot be saved.
  else if (legalForm && !legalFormsFor(country).includes(legalForm)) fields.legalForm = "invalid";
  const form = legalForm ?? null;
  const context: SenderContext = { kind: workspace.kind, country };

  const values = offeredValues(input, form, context);

  for (const [field, value] of Object.entries(values) as Array<[ValueField, string | null]>) {
    const limit = maxLength[field];
    // Links are measured after normalization (below), as they are stored.
    if (field === "website" || field === "privacyUrl") continue;
    if (value && limit && value.length > limit) fields[field] = "tooLong";
  }
  for (const field of requiredSenderFields(form, context)) {
    if (field in values && !values[field as ValueField] && !fields[field])
      fields[field] = "required";
  }
  // A KG or OHG with a liable corporation needs the details of that partner (§ 125 Abs. 1 S. 2,
  // § 177a HGB) – they are asked for under „GmbH & Co. KG“.
  if (
    (form === "kg" || form === "ohg") &&
    jurisdiction(country) !== "CH" &&
    values.companyName &&
    hasCorporatePartner(values.companyName) &&
    !fields.legalForm
  ) {
    fields.legalForm = "corporatePartner";
  }
  // A firm named „… GmbH & Co. KG“ is a GmbH & Co. KG, whatever was chosen (GmbH, AG, other …).
  if (
    form &&
    form !== "gmbh_co_kg" &&
    form !== "kg" &&
    form !== "ohg" &&
    jurisdiction(country) !== "CH" &&
    workspace.kind === "business" &&
    values.companyName &&
    gmbhCoKg.test(values.companyName) &&
    !kgaaPattern.test(values.companyName) &&
    !fields.legalForm
  ) {
    fields.legalForm = "corporatePartner";
  }
  // A KGaA chosen as KG, OHG or GmbH & Co. KG would get the wrong details.
  if (
    (form === "kg" || form === "ohg" || form === "gmbh_co_kg") &&
    values.companyName &&
    kgaaPattern.test(values.companyName) &&
    !fields.legalForm
  ) {
    fields.legalForm = "kgaa";
  }
  // An optional register is entered completely or not at all; half of it would vanish from
  // the details, which show court and number together.
  if (!requiredSenderFields(form, context).includes("registerNumber")) {
    if (values.registerCourt && !values.registerNumber && !fields.registerNumber)
      fields.registerNumber = "required";
    if (values.registerNumber && !values.registerCourt && !fields.registerCourt)
      fields.registerCourt = "required";
  }

  if (values.postalCode && !fields.postalCode) {
    const pattern = postalCodes[country] ?? /^[A-Za-z0-9 -]{3,10}$/;
    if (!pattern.test(values.postalCode)) fields.postalCode = "invalid";
  }
  for (const field of ["registerNumber", "generalPartnerRegisterNumber"] as const) {
    const value = values[field];
    if (value && !fields[field] && !registerNumberPattern.test(value)) fields[field] = "invalid";
  }
  if (values.vatId && !fields.vatId) {
    const vatId = normalizeVatId(values.vatId);
    if (vatId) values.vatId = vatId;
    else fields.vatId = "invalid";
  }
  if (values.phone && !fields.phone) {
    const digits = values.phone.replace(/\D/g, "").length;
    if (!/^\+?[\d ()/.-]+$/.test(values.phone) || digits < 6 || digits > 20)
      fields.phone = "invalid";
  }
  for (const field of ["website", "privacyUrl"] as const) {
    const value = values[field];
    if (value && !fields[field]) {
      const url = normalizeUrl(value);
      if (!url) fields[field] = "invalid";
      else if (url.length > (maxLength[field] ?? Number.POSITIVE_INFINITY))
        fields[field] = "tooLong";
      else values[field] = url;
    }
  }

  if (Object.keys(fields).length > 0) {
    return err(appError("VALIDATION", undefined, fields as Record<string, string>));
  }
  return ok({
    legalForm: form,
    companyName: values.companyName,
    address: { street: values.street, postalCode: values.postalCode, city: values.city, country },
    seat: values.seat,
    registerCourt: values.registerCourt,
    registerNumber: values.registerNumber,
    managingDirectors: values.managingDirectors,
    supervisoryBoardChair: values.supervisoryBoardChair,
    generalPartner:
      values.generalPartnerName &&
      values.generalPartnerSeat &&
      values.generalPartnerRegisterCourt &&
      values.generalPartnerRegisterNumber
        ? {
            name: values.generalPartnerName,
            seat: values.generalPartnerSeat,
            registerCourt: values.generalPartnerRegisterCourt,
            registerNumber: values.generalPartnerRegisterNumber,
          }
        : null,
    vatId: values.vatId,
    phone: values.phone,
    website: values.website,
    privacyUrl: values.privacyUrl,
  });
}

/**
 * Are all mandatory details of the legal form filled? (trust level "Verifiziert", onboarding)
 * Only presence counts: formats were checked when saving, and a stricter check added later
 * must not silently turn stored profiles incomplete.
 */
export function isSenderProfileComplete(
  profile: SenderProfileData,
  workspace: { kind: WorkspaceKind; country: WorkspaceCountry },
): boolean {
  const form = isLegalForm(profile.legalForm) ? profile.legalForm : null;
  const country = senderCountry(profile, workspace.country);
  if (workspace.kind === "business" && (!form || !legalFormsFor(country).includes(form))) {
    return false;
  }
  const context: SenderContext = { kind: workspace.kind, country };
  const values = offeredValues(profile, form, context);
  return requiredSenderFields(form, context).every(
    (field) => field === "legalForm" || field === "country" || values[field] !== null,
  );
}

export type ImprintKey =
  | "name"
  | "legalForm"
  | "address"
  | "seat"
  | "register"
  | "zvr"
  | "zvrWithAuthority"
  | "management"
  | "board"
  | "boardOfDirectors"
  | "administration"
  | "representatives"
  | "partners"
  | "generalPartner"
  | "generalPartnerManagement"
  | "supervisoryBoard"
  | "generalPartnerSupervisoryBoard"
  | "vatId";

/**
 * One line of the mandatory details: text key in de.json (`imprint.<key>`) with its parameters.
 * The legal-form line names the form and the legal system for `imprint.legalForms.<law>.<form>`.
 */
export type ImprintPart =
  | { key: Exclude<ImprintKey, "legalForm">; values: Record<string, string> }
  | { key: "legalForm"; values: { form: DesignatedForm; law: Jurisdiction } };

/**
 * The mandatory details as lines – the same everywhere they appear (signature, unsubscribe page,
 * previews). Only fields the legal form offers are shown.
 */
export function imprintParts(
  profile: SenderProfileData,
  workspace: { kind: WorkspaceKind; country: WorkspaceCountry } = {
    kind: "business",
    country: "DE",
  },
): ImprintPart[] {
  const form = isLegalForm(profile.legalForm) ? profile.legalForm : null;
  const country = senderCountry(profile, workspace.country);
  const values = offeredValues(profile, form, { kind: workspace.kind, country });
  const parts: ImprintPart[] = [];
  if (values.companyName) parts.push({ key: "name", values: { name: values.companyName } });
  // The legal form belongs to the details (concept chapter 8); without a recognisable
  // designation in the name it gets a line of its own.
  if (
    workspace.kind === "business" &&
    form &&
    values.companyName &&
    designationPattern(form, country) &&
    !hasLegalFormDesignation(values.companyName, form, country)
  ) {
    parts.push({
      key: "legalForm",
      values: { form: form as DesignatedForm, law: jurisdiction(country) },
    });
  }
  if (values.street && values.city) {
    parts.push({
      key: "address",
      values: {
        street: values.street,
        place: [values.postalCode, values.city].filter(Boolean).join(" "),
      },
    });
  }
  if (values.seat) parts.push({ key: "seat", values: { seat: values.seat } });
  if (jurisdiction(country) === "AT" && form === "ev" && values.registerNumber) {
    // The bare ZVR number would read like any number – it gets its name.
    parts.push(
      values.registerCourt
        ? {
            key: "zvrWithAuthority",
            values: { court: values.registerCourt, number: values.registerNumber },
          }
        : { key: "zvr", values: { number: values.registerNumber } },
    );
  } else if (values.registerCourt && values.registerNumber) {
    parts.push({
      key: "register",
      values: { court: values.registerCourt, number: values.registerNumber },
    });
  }
  if (
    form === "gmbh_co_kg" &&
    values.generalPartnerName &&
    values.generalPartnerSeat &&
    values.generalPartnerRegisterCourt &&
    values.generalPartnerRegisterNumber
  ) {
    parts.push({
      key: "generalPartner",
      values: {
        name: values.generalPartnerName,
        seat: values.generalPartnerSeat,
        court: values.generalPartnerRegisterCourt,
        number: values.generalPartnerRegisterNumber,
      },
    });
  }
  const role = directorsRole(form, country);
  if (role && values.managingDirectors)
    parts.push({ key: role, values: { names: values.managingDirectors } });
  if (values.supervisoryBoardChair) {
    parts.push({
      key: form === "gmbh_co_kg" ? "generalPartnerSupervisoryBoard" : "supervisoryBoard",
      values: { name: values.supervisoryBoardChair },
    });
  }
  if (values.vatId) parts.push({ key: "vatId", values: { vatId: values.vatId, country } });
  return parts;
}
