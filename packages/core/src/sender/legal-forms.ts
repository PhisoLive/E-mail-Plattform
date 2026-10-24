import { type AppError, appError } from "../errors";
import { err, ok, type Result } from "../result";

/**
 * Mandatory details for business e-mails per legal form (concept chapters 7 and 17):
 * § 37a HGB (e.K.), §§ 125a, 177a HGB (OHG, KG), § 35a GmbHG, § 80 AktG, § 25a GenG,
 * § 7 Abs. 5 PartGG; Austria § 14 UGB (Firmenbuch). The texts for the form live in de.json.
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

export type SenderField =
  | "legalForm"
  | "companyName"
  | "street"
  | "postalCode"
  | "city"
  | "country"
  | "registerCourt"
  | "registerNumber"
  | "managingDirectors"
  | "supervisoryBoardChair"
  | "vatId"
  | "phone"
  | "website"
  | "privacyUrl";

export type SenderFieldError = "required" | "invalid" | "tooLong";

export interface SenderAddress {
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}

/** Input as it comes from the form or the database. */
export interface SenderProfileData {
  legalForm?: string | null;
  companyName?: string | null;
  address?: SenderAddress | null;
  registerCourt?: string | null;
  registerNumber?: string | null;
  managingDirectors?: string | null;
  supervisoryBoardChair?: string | null;
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
  registerCourt: string | null;
  registerNumber: string | null;
  managingDirectors: string | null;
  supervisoryBoardChair: string | null;
  vatId: string | null;
  phone: string | null;
  website: string | null;
  privacyUrl: string | null;
}

const registered: readonly LegalForm[] = [
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
];
const withDirectors: readonly LegalForm[] = ["gbr", "gmbh_co_kg", "gmbh", "ug", "ag", "eg", "ev"];
const withSupervisoryBoard: readonly LegalForm[] = ["ag", "eg"];

/** How the people field is called for a legal form (label key in de.json). */
export function directorsRole(form: LegalForm | null): "management" | "board" | "partners" | null {
  if (form === "gbr") return "partners";
  if (form === "ag" || form === "eg" || form === "ev") return "board";
  if (form === "gmbh" || form === "ug" || form === "gmbh_co_kg") return "management";
  return null;
}

export function isLegalForm(value: unknown): value is LegalForm {
  return typeof value === "string" && (legalForms as readonly string[]).includes(value);
}

/** Mandatory fields in display order. Private workspaces only need a sender name. */
export function requiredSenderFields(form: LegalForm | null, kind: WorkspaceKind): SenderField[] {
  if (kind === "private") return ["companyName"];
  const fields: SenderField[] = ["companyName", "street", "postalCode", "city"];
  if (form && registered.includes(form)) fields.push("registerCourt", "registerNumber");
  if (form && withDirectors.includes(form)) fields.push("managingDirectors");
  if (form && withSupervisoryBoard.includes(form)) fields.push("supervisoryBoardChair");
  return fields;
}

/** Optional fields that the form offers for a legal form. */
export function optionalSenderFields(form: LegalForm | null, kind: WorkspaceKind): SenderField[] {
  const required = requiredSenderFields(form, kind);
  const all: SenderField[] = [
    "companyName",
    "street",
    "postalCode",
    "city",
    "registerCourt",
    "registerNumber",
    "managingDirectors",
    "supervisoryBoardChair",
    "vatId",
    "phone",
    "website",
    "privacyUrl",
  ];
  const offered = all.filter((field) => {
    if (field === "registerCourt" || field === "registerNumber")
      return Boolean(form && registered.includes(form));
    if (field === "managingDirectors") return Boolean(form && withDirectors.includes(form));
    if (field === "supervisoryBoardChair")
      return Boolean(
        form && (withSupervisoryBoard.includes(form) || form === "gmbh" || form === "ug"),
      );
    return true;
  });
  return offered.filter((field) => !required.includes(field));
}

const maxLength: Partial<Record<SenderField, number>> = {
  companyName: 200,
  street: 200,
  postalCode: 12,
  city: 120,
  registerCourt: 120,
  registerNumber: 40,
  managingDirectors: 500,
  supervisoryBoardChair: 200,
  vatId: 30,
  phone: 30,
  website: 300,
  privacyUrl: 300,
};

const postalCodes: Record<string, RegExp> = {
  DE: /^\d{5}$/,
  AT: /^\d{4}$/,
  CH: /^\d{4}$/,
};

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

/**
 * Validates and normalizes a sender profile. All mandatory fields of the legal form must be
 * filled, the optional ones must have a valid format. Errors are reported per field.
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
  if (legalForm === undefined) fields.legalForm = "invalid";
  else if (legalForm === null && workspace.kind === "business") fields.legalForm = "required";
  const form = legalForm ?? null;

  const country =
    clean(input.address?.country)?.toUpperCase() ??
    (workspace.country === "other" ? "DE" : workspace.country);
  if (!/^[A-Z]{2}$/.test(country)) fields.country = "invalid";

  const values: Record<Exclude<SenderField, "legalForm" | "country">, string | null> = {
    companyName: clean(input.companyName),
    street: clean(input.address?.street),
    postalCode: clean(input.address?.postalCode),
    city: clean(input.address?.city),
    registerCourt: clean(input.registerCourt),
    registerNumber: clean(input.registerNumber),
    managingDirectors: clean(input.managingDirectors),
    supervisoryBoardChair: clean(input.supervisoryBoardChair),
    vatId: clean(input.vatId),
    phone: clean(input.phone),
    website: clean(input.website),
    privacyUrl: clean(input.privacyUrl),
  };

  for (const [field, value] of Object.entries(values) as Array<
    [keyof typeof values, string | null]
  >) {
    const limit = maxLength[field];
    if (value && limit && value.length > limit) fields[field] = "tooLong";
  }
  for (const field of requiredSenderFields(form, workspace.kind)) {
    if (field in values && !values[field as keyof typeof values] && !fields[field])
      fields[field] = "required";
  }

  if (values.postalCode && !fields.postalCode) {
    const pattern = postalCodes[country] ?? /^[A-Za-z0-9 -]{3,10}$/;
    if (!pattern.test(values.postalCode)) fields.postalCode = "invalid";
  }
  if (values.registerNumber && !fields.registerNumber) {
    if (!/^(?=.*\d)[\p{L}\d .\-/]{2,40}$/u.test(values.registerNumber))
      fields.registerNumber = "invalid";
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
      if (url) values[field] = url;
      else fields[field] = "invalid";
    }
  }

  if (Object.keys(fields).length > 0) {
    return err(appError("VALIDATION", undefined, fields as Record<string, string>));
  }
  return ok({
    legalForm: form,
    companyName: values.companyName,
    address: { street: values.street, postalCode: values.postalCode, city: values.city, country },
    registerCourt: values.registerCourt,
    registerNumber: values.registerNumber,
    managingDirectors: values.managingDirectors,
    supervisoryBoardChair: values.supervisoryBoardChair,
    vatId: values.vatId,
    phone: values.phone,
    website: values.website,
    privacyUrl: values.privacyUrl,
  });
}

/** Are all mandatory details of the legal form filled? (trust level "Verifiziert", onboarding) */
export function isSenderProfileComplete(profile: SenderProfileData, kind: WorkspaceKind): boolean {
  const form = isLegalForm(profile.legalForm) ? profile.legalForm : null;
  if (kind === "business" && !form) return false;
  const value = (field: SenderField): string | null => {
    switch (field) {
      case "street":
      case "postalCode":
      case "city":
        return clean(profile.address?.[field]);
      case "legalForm":
      case "country":
        return "set";
      default:
        return clean(profile[field]);
    }
  };
  return requiredSenderFields(form, kind).every((field) => value(field) !== null);
}
