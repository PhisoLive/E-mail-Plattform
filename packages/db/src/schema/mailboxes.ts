/** Area B – mailboxes and domains (concept chapter 4). */
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps, tz } from "./_common";
import {
  checkStatus,
  connectionSecurity,
  domainOwnership,
  mailboxProfile,
  mailboxProvider,
  mailboxStatus,
} from "./enums";
import { platformSecrets, secrets, workspaceId } from "./workspaces";

export interface SendingWindowValue {
  days: number[];
  start: string;
  end: string;
  skipHolidays: boolean;
}

export interface MailboxFolders {
  inbox?: string;
  sent?: string;
  spam?: string;
  trash?: string;
  drafts?: string;
  archive?: string;
}

/** Provider specific sync position (concept chapter 4/5). */
export type SyncCursorValue =
  | {
      kind: "imap";
      folders: Record<string, { uidValidity: string; lastUid: number; modSeq?: string }>;
    }
  | { kind: "gmail"; historyId: string }
  | { kind: "graph"; deltaLinks: Record<string, string> };

export const domains = pgTable(
  "domains",
  {
    id: id(),
    workspaceId: workspaceId(),
    name: text("name").notNull(),
    ownership: domainOwnership("ownership").notNull().default("customer"),
    spfStatus: checkStatus("spf_status").notNull().default("pending"),
    dkimStatus: checkStatus("dkim_status").notNull().default("pending"),
    dkimSelectors: text("dkim_selectors").array().notNull().default([]),
    dmarcStatus: checkStatus("dmarc_status").notNull().default("pending"),
    dmarcPolicy: text("dmarc_policy"),
    mxStatus: checkStatus("mx_status").notNull().default("pending"),
    alignmentStatus: checkStatus("alignment_status").notNull().default("pending"),
    blocklistStatus: checkStatus("blocklist_status").notNull().default("pending"),
    lastCheckAt: tz("last_check_at"),
    nextCheckAt: tz("next_check_at"),
    checkResult: jsonb("check_result").$type<Record<string, unknown>>(),
    ...timestamps(),
  },
  (t) => [
    unique("domains_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("domains_ws_name_uq").on(t.workspaceId, t.name),
    index("domains_next_check_idx").on(t.nextCheckAt),
  ],
);

export const mailboxes = pgTable(
  "mailboxes",
  {
    id: id(),
    workspaceId: workspaceId(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    provider: mailboxProvider("provider").notNull(),
    /** Key of the provider preset (Anhang B), e.g. `gmx`, `gmail`, `custom`. */
    providerPreset: text("provider_preset"),
    profile: mailboxProfile("profile").notNull().default("new"),
    status: mailboxStatus("status").notNull().default("connecting"),
    pauseReason: text("pause_reason"),
    pauseDetails: jsonb("pause_details").$type<Record<string, unknown>>(),
    credentialId: uuid("credential_id"),
    username: text("username"),
    imapHost: text("imap_host"),
    imapPort: integer("imap_port"),
    imapSecurity: connectionSecurity("imap_security"),
    smtpHost: text("smtp_host"),
    smtpPort: integer("smtp_port"),
    smtpSecurity: connectionSecurity("smtp_security"),
    smtpSavesSent: boolean("smtp_saves_sent").notNull().default(true),
    folders: jsonb("folders").$type<MailboxFolders>().notNull().default({}),
    syncCursor: jsonb("sync_cursor").$type<SyncCursorValue>(),
    lastSyncAt: tz("last_sync_at"),
    nextSyncAt: tz("next_sync_at"),
    dailyLimitTotalTarget: integer("daily_limit_total_target"),
    dailyLimitColdTarget: integer("daily_limit_cold_target"),
    dailyLimitTotal: integer("daily_limit_total"),
    dailyLimitCold: integer("daily_limit_cold"),
    providerCap24h: integer("provider_cap_24h"),
    rampStartedAt: tz("ramp_started_at"),
    minIntervalS: integer("min_interval_s"),
    maxIntervalS: integer("max_interval_s"),
    sendingWindow: jsonb("sending_window").$type<SendingWindowValue>(),
    signatureHtml: text("signature_html"),
    signatureText: text("signature_text"),
    healthScore: integer("health_score"),
    oneClickSupported: boolean("one_click_supported"),
    domainId: uuid("domain_id"),
    lastSentAt: tz("last_sent_at"),
    nextSendAt: tz("next_send_at"),
    /** Provider limit hit: no sending before this time (concept chapter 9). */
    throttledUntil: tz("throttled_until"),
    consecutiveContentRejections: integer("consecutive_content_rejections").notNull().default(0),
    lastError: jsonb("last_error").$type<{ code: string; at: string }>(),
    disconnectedAt: tz("disconnected_at"),
    ...timestamps(),
  },
  (t) => [
    unique("mailboxes_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("mailboxes_ws_email_uq").on(t.workspaceId, t.email),
    index("mailboxes_status_idx").on(t.status),
    index("mailboxes_next_sync_idx").on(t.nextSyncAt),
    foreignKey({
      name: "mailboxes_credential_fk",
      columns: [t.workspaceId, t.credentialId],
      foreignColumns: [secrets.workspaceId, secrets.id],
    }),
    foreignKey({
      name: "mailboxes_domain_fk",
      columns: [t.workspaceId, t.domainId],
      foreignColumns: [domains.workspaceId, domains.id],
    }),
  ],
);

export const trackingDomains = pgTable(
  "tracking_domains",
  {
    id: id(),
    workspaceId: workspaceId(),
    hostname: text("hostname").notNull(),
    cnameTarget: text("cname_target").notNull(),
    tlsStatus: checkStatus("tls_status").notNull().default("pending"),
    verifiedAt: tz("verified_at"),
    ...timestamps(),
  },
  (t) => [
    unique("tracking_domains_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("tracking_domains_hostname_uq").on(t.hostname),
  ],
);

export const mailboxDailyStats = pgTable(
  "mailbox_daily_stats",
  {
    workspaceId: workspaceId(),
    mailboxId: uuid("mailbox_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    sent: integer("sent").notNull().default(0),
    sentCold: integer("sent_cold").notNull().default(0),
    bouncedHard: integer("bounced_hard").notNull().default(0),
    bouncedSoft: integer("bounced_soft").notNull().default(0),
    replies: integer("replies").notNull().default(0),
    coldReplies: integer("cold_replies").notNull().default(0),
    autoReplies: integer("auto_replies").notNull().default(0),
    unsubscribes: integer("unsubscribes").notNull().default(0),
    complaints: integer("complaints").notNull().default(0),
    providerErrors: integer("provider_errors").notNull().default(0),
    contentRejections: integer("content_rejections").notNull().default(0),
    limitEffective: integer("limit_effective"),
    healthScore: real("health_score"),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ name: "mailbox_daily_stats_pk", columns: [t.mailboxId, t.date] }),
    foreignKey({
      name: "mailbox_daily_stats_mailbox_fk",
      columns: [t.workspaceId, t.mailboxId],
      foreignColumns: [mailboxes.workspaceId, mailboxes.id],
    }).onDelete("cascade"),
    index("mailbox_daily_stats_ws_date_idx").on(t.workspaceId, t.date),
  ],
);

/** Platform-wide seed accounts for inbox tests – admin only (concept chapter 12). */
export const seedAccounts = pgTable(
  "seed_accounts",
  {
    id: id(),
    provider: text("provider").notNull(),
    email: text("email").notNull(),
    imapHost: text("imap_host").notNull(),
    imapPort: integer("imap_port").notNull().default(993),
    imapSecurity: connectionSecurity("imap_security").notNull().default("tls"),
    authMethod: text("auth_method").notNull().default("password").$type<"password" | "xoauth2">(),
    credentialId: uuid("credential_id").references(() => platformSecrets.id, {
      onDelete: "set null",
    }),
    active: boolean("active").notNull().default(true),
    lastOkAt: tz("last_ok_at"),
    lastError: text("last_error"),
    ...timestamps(),
  },
  (t) => [uniqueIndex("seed_accounts_email_uq").on(t.email)],
);
