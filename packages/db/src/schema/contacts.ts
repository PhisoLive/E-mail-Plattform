/** Area C – contacts, lists, imports and suppression lists (concept chapters 4 and 7). */
import { sql } from "drizzle-orm";
import {
  customType,
  foreignKey,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, timestamps, tz } from "./_common";
import {
  contactStatus,
  formality,
  importStatus,
  legalBasis,
  listKind,
  salutation,
  verificationStatus,
} from "./enums";
import { files } from "./files";
import { workspaceId } from "./workspaces";

/** Case-insensitive text (`citext` extension). */
export const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export interface ConsentProof {
  wording?: string;
  confirmation?: string;
  purchaseDate?: string;
  contractReference?: string;
  justification?: string;
}

export const contacts = pgTable(
  "contacts",
  {
    id: id(),
    workspaceId: workspaceId(),
    email: citext("email").notNull(),
    emailHash: text("email_hash").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    salutation: salutation("salutation").notNull().default("none"),
    title: text("title"),
    formality: formality("formality").notNull().default("auto"),
    company: text("company"),
    position: text("position"),
    phone: text("phone"),
    website: text("website"),
    city: text("city"),
    region: text("region"),
    country: text("country"),
    timezone: text("timezone"),
    language: text("language"),
    customFields: jsonb("custom_fields").$type<Record<string, string>>().notNull().default({}),
    tags: text("tags").array().notNull().default([]),
    status: contactStatus("status").notNull().default("active"),
    verificationStatus: verificationStatus("verification_status").notNull().default("unknown"),
    verificationDetails: jsonb("verification_details").$type<Record<string, unknown>>(),
    legalBasis: legalBasis("legal_basis").notNull().default("unknown"),
    consentSource: text("consent_source"),
    consentAt: tz("consent_at"),
    consentProof: jsonb("consent_proof").$type<ConsentProof>(),
    source: text("source"),
    lastContactedAt: tz("last_contacted_at"),
    lastRepliedAt: tz("last_replied_at"),
    ...timestamps(),
  },
  (t) => [
    unique("contacts_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("contacts_ws_email_uq").on(t.workspaceId, t.email),
    index("contacts_ws_hash_idx").on(t.workspaceId, t.emailHash),
    index("contacts_tags_gin").using("gin", t.tags),
    index("contacts_name_trgm").using(
      "gin",
      sql`(coalesce(${t.firstName}, '') || ' ' || coalesce(${t.lastName}, '') || ' ' || coalesce(${t.company}, '')) gin_trgm_ops`,
    ),
    index("contacts_ws_status_idx").on(t.workspaceId, t.status),
  ],
);

export interface ContactFilter {
  all?: ContactFilter[];
  any?: ContactFilter[];
  field?: string;
  op?: string;
  value?: unknown;
}

export const contactLists = pgTable(
  "contact_lists",
  {
    id: id(),
    workspaceId: workspaceId(),
    name: text("name").notNull(),
    kind: listKind("kind").notNull(),
    filter: jsonb("filter").$type<ContactFilter>(),
    description: text("description"),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [unique("contact_lists_ws_id_uq").on(t.workspaceId, t.id)],
);

export const contactListMembers = pgTable(
  "contact_list_members",
  {
    workspaceId: workspaceId(),
    listId: uuid("list_id").notNull(),
    contactId: uuid("contact_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ name: "contact_list_members_pk", columns: [t.listId, t.contactId] }),
    foreignKey({
      name: "contact_list_members_list_fk",
      columns: [t.workspaceId, t.listId],
      foreignColumns: [contactLists.workspaceId, contactLists.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "contact_list_members_contact_fk",
      columns: [t.workspaceId, t.contactId],
      foreignColumns: [contacts.workspaceId, contacts.id],
    }).onDelete("cascade"),
    index("contact_list_members_contact_idx").on(t.workspaceId, t.contactId),
  ],
);

export interface ImportStats {
  total?: number;
  new?: number;
  updated?: number;
  skipped?: number;
  invalid?: number;
  processed?: number;
}

export const imports = pgTable(
  "imports",
  {
    id: id(),
    workspaceId: workspaceId(),
    fileId: uuid("file_id"),
    status: importStatus("status").notNull().default("uploaded"),
    mapping: jsonb("mapping").$type<Record<string, string>>(),
    options: jsonb("options").$type<Record<string, unknown>>().notNull().default({}),
    stats: jsonb("stats").$type<ImportStats>().notNull().default({}),
    errorsFileId: uuid("errors_file_id"),
    createdBy: uuid("created_by"),
    ...timestamps(),
  },
  (t) => [
    unique("imports_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "imports_file_fk",
      columns: [t.workspaceId, t.fileId],
      foreignColumns: [files.workspaceId, files.id],
    }),
    foreignKey({
      name: "imports_errors_file_fk",
      columns: [t.workspaceId, t.errorsFileId],
      foreignColumns: [files.workspaceId, files.id],
    }),
  ],
);
