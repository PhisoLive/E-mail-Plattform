/**
 * Area A – accounts and workspaces (concept chapter 4).
 * Every tenant table carries `workspace_id`; references between tenant tables use
 * composite foreign keys (`workspace_id`, `id`) so data of two customers can never mix.
 */
import {
  type AnyPgColumn,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, timestamps, tz } from "./_common";
import { user } from "./auth";
import {
  actorType,
  formality,
  memberRole,
  secretKind,
  trustLevel,
  workspaceCountry,
  workspaceKind,
} from "./enums";

export const workspaces = pgTable(
  "workspaces",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    kind: workspaceKind("kind").notNull().default("business"),
    country: workspaceCountry("country").notNull().default("DE"),
    timezone: text("timezone").notNull().default("Europe/Berlin"),
    defaultLanguage: text("default_language").notNull().default("de-DE"),
    defaultFormality: formality("default_formality").notNull().default("sie"),
    trustLevel: trustLevel("trust_level").notNull().default("new"),
    planCode: text("plan_code").notNull().default("beta"),
    settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
    /** Emergency brake "Alle Agenten pausieren" (concept chapter 11). */
    agentsPausedAt: tz("agents_paused_at"),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [uniqueIndex("workspaces_slug_uq").on(t.slug)],
);

/** Standard `workspace_id` column referencing the tenant. */
export const workspaceId = () =>
  uuid("workspace_id")
    .notNull()
    .references((): AnyPgColumn => workspaces.id, { onDelete: "cascade" });

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: id(),
    workspaceId: workspaceId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull(),
    ...timestamps(),
  },
  (t) => [
    unique("workspace_members_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("workspace_members_ws_user_uq").on(t.workspaceId, t.userId),
    index("workspace_members_user_idx").on(t.userId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: id(),
    workspaceId: workspaceId(),
    email: text("email").notNull(),
    role: memberRole("role").notNull(),
    /** SHA-256 of the invitation token – the token itself is never stored. */
    tokenHash: text("token_hash").notNull(),
    expiresAt: tz("expires_at").notNull(),
    invitedBy: uuid("invited_by").references(() => user.id, { onDelete: "set null" }),
    acceptedAt: tz("accepted_at"),
    acceptedBy: uuid("accepted_by").references(() => user.id, { onDelete: "set null" }),
    revokedAt: tz("revoked_at"),
    ...timestamps(),
  },
  (t) => [
    unique("invitations_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("invitations_token_hash_uq").on(t.tokenHash),
    index("invitations_ws_email_idx").on(t.workspaceId, t.email),
  ],
);

export const senderProfiles = pgTable(
  "sender_profiles",
  {
    id: id(),
    workspaceId: workspaceId(),
    companyName: text("company_name"),
    legalForm: text("legal_form"),
    address: jsonb("address").$type<{
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      country?: string | null;
    }>(),
    /**
     * Registered seat; may differ from the town of the address (§ 4a GmbHG, § 5 AktG). Not
     * derived from the address – existing profiles of registered firms ask for it again.
     */
    seat: text("seat"),
    registerCourt: text("register_court"),
    registerNumber: text("register_number"),
    managingDirectors: text("managing_directors"),
    /** Chair of the supervisory board – mandatory for a German AG (§ 80 AktG), for an eG if it has one (§ 25a GenG). */
    supervisoryBoardChair: text("supervisory_board_chair"),
    /** General partner of a GmbH & Co. KG (§ 125 Abs. 1 S. 2, § 177a HGB). */
    generalPartner: jsonb("general_partner").$type<{
      name: string;
      seat: string;
      registerCourt: string;
      registerNumber: string;
    }>(),
    vatId: text("vat_id"),
    phone: text("phone"),
    website: text("website"),
    privacyUrl: text("privacy_url"),
    ...timestamps(),
  },
  (t) => [
    unique("sender_profiles_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("sender_profiles_ws_uq").on(t.workspaceId),
  ],
);

/** Append-only audit log. Never updated or deleted except by the retention job. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    /** Null only for platform-level admin actions. */
    workspaceId: uuid("workspace_id").references((): AnyPgColumn => workspaces.id, {
      onDelete: "cascade",
    }),
    actorType: actorType("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    objectType: text("object_type"),
    objectId: text("object_id"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_ws_created_idx").on(t.workspaceId, t.createdAt),
    index("audit_logs_object_idx").on(t.objectType, t.objectId),
  ],
);

/**
 * Status change events for entities other than messages (campaigns, recipients, mailboxes,
 * approvals, tasks) – written by `transition()`. Messages use `message_events`.
 * Addition to the concept, see docs/ENTSCHEIDUNGEN.md.
 */
export const entityEvents = pgTable(
  "entity_events",
  {
    id: id(),
    workspaceId: workspaceId(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
    actorType: actorType("actor_type").notNull(),
    actorId: text("actor_id"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: tz("occurred_at").notNull().defaultNow(),
  },
  (t) => [
    index("entity_events_entity_idx").on(t.workspaceId, t.entityType, t.entityId, t.occurredAt),
  ],
);

/** Data key per workspace, wrapped with the master key (concept chapter 16). */
export const workspaceKeys = pgTable(
  "workspace_keys",
  {
    id: id(),
    workspaceId: workspaceId(),
    keyVersion: integer("key_version").notNull(),
    /** Version of the master key that wrapped this data key. */
    masterKeyVersion: integer("master_key_version").notNull(),
    wrappedDek: text("wrapped_dek").notNull(),
    createdAt: createdAt(),
    retiredAt: tz("retired_at"),
  },
  (t) => [
    unique("workspace_keys_ws_id_uq").on(t.workspaceId, t.id),
    unique("workspace_keys_ws_version_uq").on(t.workspaceId, t.keyVersion),
  ],
);

export const secrets = pgTable(
  "secrets",
  {
    id: id(),
    workspaceId: workspaceId(),
    kind: secretKind("kind").notNull(),
    ciphertext: text("ciphertext").notNull(),
    nonce: text("nonce").notNull(),
    keyVersion: integer("key_version").notNull(),
    expiresAt: tz("expires_at"),
    scopes: text("scopes").array(),
    ...timestamps(),
  },
  (t) => [
    unique("secrets_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "secrets_key_fk",
      columns: [t.workspaceId, t.keyVersion],
      foreignColumns: [workspaceKeys.workspaceId, workspaceKeys.keyVersion],
    }),
  ],
);

/** Platform-wide secrets (e.g. seed accounts for inbox tests), encrypted with the master key. */
export const platformSecrets = pgTable("platform_secrets", {
  id: id(),
  kind: secretKind("kind").notNull(),
  ciphertext: text("ciphertext").notNull(),
  nonce: text("nonce").notNull(),
  masterKeyVersion: integer("master_key_version").notNull(),
  expiresAt: tz("expires_at"),
  scopes: text("scopes").array(),
  ...timestamps(),
});
