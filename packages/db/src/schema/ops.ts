/** Areas G (rest) and H – notifications, channels, API, integrations, abuse and flags (concept chapter 4). */
import {
  boolean,
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
import { id, timestamps, tz } from "./_common";
import { user } from "./auth";
import { abuseStatus, channelKind, featureFlagScope, integrationKind } from "./enums";
import { secrets, workspaceId, workspaces } from "./workspaces";

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    workspaceId: workspaceId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link"),
    readAt: tz("read_at"),
    emailedAt: tz("emailed_at"),
    ...timestamps(),
  },
  (t) => [
    unique("notifications_ws_id_uq").on(t.workspaceId, t.id),
    index("notifications_user_idx").on(t.userId, t.createdAt),
  ],
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: id(),
    workspaceId: workspaceId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Channels per notification kind, e.g. { approval_needed: ["in_app", "email"] }. */
    channels: jsonb("channels").$type<Record<string, string[]>>().notNull().default({}),
    ...timestamps(),
  },
  (t) => [uniqueIndex("notification_settings_ws_user_uq").on(t.workspaceId, t.userId)],
);

/** Later (phase 13). */
export const channelLinks = pgTable(
  "channel_links",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    channel: channelKind("channel").notNull(),
    externalId: text("external_id").notNull(),
    verifiedAt: tz("verified_at"),
    ...timestamps(),
  },
  (t) => [uniqueIndex("channel_links_channel_external_uq").on(t.channel, t.externalId)],
);

/** Later (phase 13). Keys only as hash + prefix. */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: id(),
    workspaceId: workspaceId(),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: text("scopes").array().notNull().default([]),
    lastUsedAt: tz("last_used_at"),
    revokedAt: tz("revoked_at"),
    ...timestamps(),
  },
  (t) => [
    unique("api_keys_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("api_keys_hash_uq").on(t.keyHash),
  ],
);

/** Later (phase 13). */
export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: id(),
    workspaceId: workspaceId(),
    url: text("url").notNull(),
    events: text("events").array().notNull().default([]),
    secretId: uuid("secret_id"),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    unique("webhook_endpoints_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "webhook_endpoints_secret_fk",
      columns: [t.workspaceId, t.secretId],
      foreignColumns: [secrets.workspaceId, secrets.id],
    }),
  ],
);

/** Later (phase 13). */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: id(),
    workspaceId: workspaceId(),
    endpointId: uuid("endpoint_id").notNull(),
    event: text("event").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastStatus: integer("last_status"),
    deliveredAt: tz("delivered_at"),
    nextAttemptAt: tz("next_attempt_at"),
    ...timestamps(),
  },
  (t) => [
    foreignKey({
      name: "webhook_deliveries_endpoint_fk",
      columns: [t.workspaceId, t.endpointId],
      foreignColumns: [webhookEndpoints.workspaceId, webhookEndpoints.id],
    }).onDelete("cascade"),
  ],
);

/** Later (phase 13). */
export const integrations = pgTable(
  "integrations",
  {
    id: id(),
    workspaceId: workspaceId(),
    kind: integrationKind("kind").notNull(),
    credentialId: uuid("credential_id"),
    settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
    lastSyncAt: tz("last_sync_at"),
    ...timestamps(),
  },
  (t) => [
    unique("integrations_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "integrations_credential_fk",
      columns: [t.workspaceId, t.credentialId],
      foreignColumns: [secrets.workspaceId, secrets.id],
    }),
  ],
);

export const abuseReports = pgTable(
  "abuse_reports",
  {
    id: id(),
    source: text("source").notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    mailboxId: uuid("mailbox_id"),
    messageId: uuid("message_id"),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    status: abuseStatus("status").notNull().default("open"),
    decidedBy: uuid("decided_by").references(() => user.id, { onDelete: "set null" }),
    decidedAt: tz("decided_at"),
    decisionNote: text("decision_note"),
    ...timestamps(),
  },
  (t) => [index("abuse_reports_status_idx").on(t.status, t.createdAt)],
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: id(),
    key: text("key").notNull(),
    scope: featureFlagScope("scope").notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    ...timestamps(),
  },
  (t) => [uniqueIndex("feature_flags_key_scope_ws_uq").on(t.key, t.scope, t.workspaceId)],
);

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  ...timestamps(),
});
