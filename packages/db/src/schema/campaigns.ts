/** Area E – campaigns ("Aufträge"), messages, threads, approvals and tasks (concept chapters 4 and 9). */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, timestamps, tz } from "./_common";
import { agents } from "./agents";
import { user } from "./auth";
import { contacts } from "./contacts";
import {
  actorType,
  approvalKind,
  approvalStatus,
  audienceType,
  campaignKind,
  campaignPurpose,
  campaignStatus,
  delayUnit,
  messageDirection,
  messageStatus,
  personalizationLevel,
  recipientStatus,
  stepKind,
  taskKind,
  taskStatus,
  threadCategory,
} from "./enums";
import { files } from "./files";
import { mailboxes, type SendingWindowValue } from "./mailboxes";
import { workspaceId } from "./workspaces";

export interface CampaignAudience {
  listIds?: string[];
  contactIds?: string[];
  filter?: Record<string, unknown>;
  /** Number of recipients at snapshot time. */
  count?: number;
}

export const campaigns = pgTable(
  "campaigns",
  {
    id: id(),
    workspaceId: workspaceId(),
    agentId: uuid("agent_id"),
    createdBy: uuid("created_by").references(() => user.id, { onDelete: "set null" }),
    kind: campaignKind("kind").notNull(),
    purpose: campaignPurpose("purpose").notNull().default("personal"),
    name: text("name").notNull(),
    goal: text("goal").notNull().default(""),
    status: campaignStatus("status").notNull().default("draft"),
    templateKey: text("template_key"),
    audience: jsonb("audience").$type<CampaignAudience>().notNull().default({}),
    audienceSnapshotAt: tz("audience_snapshot_at"),
    mailboxPool: uuid("mailbox_pool").array().notNull().default([]),
    sendingWindow: jsonb("sending_window").$type<SendingWindowValue>(),
    startAt: tz("start_at"),
    dailyCap: integer("daily_cap"),
    personalizationLevel: personalizationLevel("personalization_level")
      .notNull()
      .default("variables"),
    researchEnabled: boolean("research_enabled").notNull().default(false),
    tracking: jsonb("tracking").$type<{ clicks: boolean }>().notNull().default({ clicks: false }),
    unsubscribe: jsonb("unsubscribe")
      .$type<{ enabled: boolean }>()
      .notNull()
      .default({ enabled: true }),
    replyBehavior: text("reply_behavior")
      .notNull()
      .default("sort_only")
      .$type<"agent" | "draft" | "sort_only">(),
    stopRules: jsonb("stop_rules").$type<Record<string, boolean>>().notNull().default({}),
    resultSchema: jsonb("result_schema").$type<Record<string, unknown>>(),
    preflightResult: jsonb("preflight_result").$type<Record<string, unknown>>(),
    stats: jsonb("stats").$type<Record<string, number>>().notNull().default({}),
    estimatedFinishAt: tz("estimated_finish_at"),
    report: jsonb("report").$type<Record<string, unknown>>(),
    startedAt: tz("started_at"),
    completedAt: tz("completed_at"),
    pauseReason: text("pause_reason"),
    ...timestamps(),
  },
  (t) => [
    unique("campaigns_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "campaigns_agent_fk",
      columns: [t.workspaceId, t.agentId],
      foreignColumns: [agents.workspaceId, agents.id],
    }),
    index("campaigns_ws_status_idx").on(t.workspaceId, t.status),
  ],
);

export const campaignSteps = pgTable(
  "campaign_steps",
  {
    id: id(),
    workspaceId: workspaceId(),
    campaignId: uuid("campaign_id").notNull(),
    position: smallint("position").notNull(),
    kind: stepKind("kind").notNull().default("email"),
    delayValue: integer("delay_value").notNull().default(0),
    delayUnit: delayUnit("delay_unit").notNull().default("business_days"),
    subjectTemplate: text("subject_template").notNull().default(""),
    bodyTemplate: text("body_template").notNull().default(""),
    aiInstructions: text("ai_instructions"),
    sameThread: boolean("same_thread").notNull().default(true),
    condition: jsonb("condition").$type<Record<string, unknown>>(),
    ...timestamps(),
  },
  (t) => [
    unique("campaign_steps_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("campaign_steps_position_uq").on(t.campaignId, t.position),
    foreignKey({
      name: "campaign_steps_campaign_fk",
      columns: [t.workspaceId, t.campaignId],
      foreignColumns: [campaigns.workspaceId, campaigns.id],
    }).onDelete("cascade"),
  ],
);

/** Own templates of a workspace. System templates live in packages/config/templates. */
export const templates = pgTable(
  "templates",
  {
    id: id(),
    workspaceId: workspaceId(),
    name: text("name").notNull(),
    purpose: campaignPurpose("purpose").notNull(),
    kind: campaignKind("kind").notNull(),
    description: text("description").notNull().default(""),
    steps: jsonb("steps").$type<unknown[]>().notNull().default([]),
    resultSchema: jsonb("result_schema").$type<Record<string, unknown>>(),
    replyRules: jsonb("reply_rules").$type<Record<string, unknown>>(),
    legalBasisHint: text("legal_basis_hint"),
    version: integer("version").notNull().default(1),
    ...timestamps(),
  },
  (t) => [unique("templates_ws_id_uq").on(t.workspaceId, t.id)],
);

export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: id(),
    workspaceId: workspaceId(),
    campaignId: uuid("campaign_id").notNull(),
    contactId: uuid("contact_id").notNull(),
    mailboxId: uuid("mailbox_id"),
    status: recipientStatus("status").notNull().default("pending"),
    skipReason: text("skip_reason"),
    currentStep: smallint("current_step").notNull().default(0),
    nextStepAt: tz("next_step_at"),
    personalization: jsonb("personalization").$type<Record<string, unknown>>(),
    result: jsonb("result").$type<Record<string, unknown>>(),
    repliedAt: tz("replied_at"),
    ...timestamps(),
  },
  (t) => [
    unique("campaign_recipients_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("campaign_recipients_campaign_contact_uq").on(t.campaignId, t.contactId),
    index("campaign_recipients_campaign_status_idx").on(t.campaignId, t.status),
    index("campaign_recipients_next_step_idx").on(t.nextStepAt).where(sql`${t.status} = 'active'`),
    foreignKey({
      name: "campaign_recipients_campaign_fk",
      columns: [t.workspaceId, t.campaignId],
      foreignColumns: [campaigns.workspaceId, campaigns.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "campaign_recipients_contact_fk",
      columns: [t.workspaceId, t.contactId],
      foreignColumns: [contacts.workspaceId, contacts.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "campaign_recipients_mailbox_fk",
      columns: [t.workspaceId, t.mailboxId],
      foreignColumns: [mailboxes.workspaceId, mailboxes.id],
    }),
  ],
);

export const threads = pgTable(
  "threads",
  {
    id: id(),
    workspaceId: workspaceId(),
    mailboxId: uuid("mailbox_id").notNull(),
    contactId: uuid("contact_id"),
    /** Stored contact address of the thread – the only address agent replies may go to. */
    contactEmail: text("contact_email"),
    subjectNormalized: text("subject_normalized").notNull().default(""),
    providerThreadId: text("provider_thread_id"),
    lastMessageAt: tz("last_message_at"),
    category: threadCategory("category"),
    categoryByUser: boolean("category_by_user").notNull().default(false),
    intent: text("intent"),
    summary: text("summary"),
    labels: text("labels").array().notNull().default([]),
    campaignId: uuid("campaign_id"),
    assignedAgentId: uuid("assigned_agent_id"),
    snoozedUntil: tz("snoozed_until"),
    dataRequestDueAt: tz("data_request_due_at"),
    /** Last time the user wrote in this thread themselves (agent then stays silent). */
    userWroteAt: tz("user_wrote_at"),
    messageCount: integer("message_count").notNull().default(0),
    unread: boolean("unread").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    unique("threads_ws_id_uq").on(t.workspaceId, t.id),
    index("threads_ws_category_idx").on(t.workspaceId, t.category, t.lastMessageAt),
    index("threads_mailbox_idx").on(t.mailboxId, t.lastMessageAt),
    index("threads_subject_idx").on(t.workspaceId, t.subjectNormalized),
    foreignKey({
      name: "threads_mailbox_fk",
      columns: [t.workspaceId, t.mailboxId],
      foreignColumns: [mailboxes.workspaceId, mailboxes.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "threads_contact_fk",
      columns: [t.workspaceId, t.contactId],
      foreignColumns: [contacts.workspaceId, contacts.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "threads_campaign_fk",
      columns: [t.workspaceId, t.campaignId],
      foreignColumns: [campaigns.workspaceId, campaigns.id],
    }),
    foreignKey({
      name: "threads_agent_fk",
      columns: [t.workspaceId, t.assignedAgentId],
      foreignColumns: [agents.workspaceId, agents.id],
    }),
  ],
);

export interface AddressValue {
  address: string;
  name?: string;
}

export const messages = pgTable(
  "messages",
  {
    id: id(),
    workspaceId: workspaceId(),
    mailboxId: uuid("mailbox_id").notNull(),
    threadId: uuid("thread_id"),
    campaignId: uuid("campaign_id"),
    stepId: uuid("step_id"),
    recipientId: uuid("recipient_id"),
    contactId: uuid("contact_id"),
    direction: messageDirection("direction").notNull(),
    status: messageStatus("status").notNull(),
    audienceType: audienceType("audience_type"),
    /** 1 replies to humans, 2 single mails, 3 follow-ups, 4 cold outreach (concept chapter 9). */
    priority: smallint("priority").notNull().default(4),
    scheduledAt: tz("scheduled_at"),
    sentAt: tz("sent_at"),
    receivedAt: tz("received_at"),
    idempotencyKey: text("idempotency_key"),
    rfcMessageId: text("rfc_message_id"),
    inReplyTo: text("in_reply_to"),
    references: text("references").array().notNull().default([]),
    providerMessageId: text("provider_message_id"),
    providerThreadId: text("provider_thread_id"),
    providerDraftId: text("provider_draft_id"),
    sendUnverified: boolean("send_unverified").notNull().default(false),
    fromAddress: text("from_address"),
    fromName: text("from_name"),
    toAddresses: jsonb("to_addresses").$type<AddressValue[]>().notNull().default([]),
    ccAddresses: jsonb("cc_addresses").$type<AddressValue[]>().notNull().default([]),
    replyTo: jsonb("reply_to").$type<AddressValue[]>().notNull().default([]),
    subject: text("subject").notNull().default(""),
    snippet: text("snippet"),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    /** Reply text without quotes and signature (inbound). */
    bodyTextClean: text("body_text_clean"),
    rawStorageKey: text("raw_storage_key"),
    sizeBytes: integer("size_bytes"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: jsonb("last_error").$type<{
      code: string;
      class?: string;
      message?: string;
      at: string;
    }>(),
    classification: jsonb("classification").$type<Record<string, unknown>>(),
    isAutoReply: boolean("is_auto_reply").notNull().default(false),
    isBounce: boolean("is_bounce").notNull().default(false),
    bounce: jsonb("bounce").$type<Record<string, unknown>>(),
    /** 128-bit random token for unsubscribe links (concept chapter 15). */
    publicToken: text("public_token"),
    generatedBy: text("generated_by").$type<"template" | "ai" | "user" | "agent">(),
    aiModel: text("ai_model"),
    /** Edited by hand – never regenerated (concept chapter 8). */
    manualOverride: boolean("manual_override").notNull().default(false),
    preflightFlags: jsonb("preflight_flags").$type<string[]>().notNull().default([]),
    ...timestamps(),
  },
  (t) => [
    unique("messages_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("messages_ws_idempotency_uq").on(t.workspaceId, t.idempotencyKey),
    uniqueIndex("messages_public_token_uq").on(t.publicToken),
    index("messages_scheduler_idx")
      .on(t.mailboxId, t.priority, t.scheduledAt)
      .where(sql`${t.status} = 'scheduled'`),
    index("messages_mailbox_status_idx").on(t.mailboxId, t.status),
    index("messages_rfc_message_id_idx").on(t.rfcMessageId),
    index("messages_thread_created_idx").on(t.threadId, t.createdAt),
    index("messages_campaign_idx").on(t.campaignId, t.status),
    index("messages_recipient_idx").on(t.recipientId),
    index("messages_inbound_fts")
      .using(
        "gin",
        sql`to_tsvector('german', coalesce(${t.subject}, '') || ' ' || coalesce(${t.bodyText}, ''))`,
      )
      .where(sql`${t.direction} = 'inbound'`),
    foreignKey({
      name: "messages_mailbox_fk",
      columns: [t.workspaceId, t.mailboxId],
      foreignColumns: [mailboxes.workspaceId, mailboxes.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "messages_thread_fk",
      columns: [t.workspaceId, t.threadId],
      foreignColumns: [threads.workspaceId, threads.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "messages_campaign_fk",
      columns: [t.workspaceId, t.campaignId],
      foreignColumns: [campaigns.workspaceId, campaigns.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "messages_step_fk",
      columns: [t.workspaceId, t.stepId],
      foreignColumns: [campaignSteps.workspaceId, campaignSteps.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "messages_recipient_fk",
      columns: [t.workspaceId, t.recipientId],
      foreignColumns: [campaignRecipients.workspaceId, campaignRecipients.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "messages_contact_fk",
      columns: [t.workspaceId, t.contactId],
      foreignColumns: [contacts.workspaceId, contacts.id],
    }).onDelete("cascade"),
  ],
);

/** Append-only; later partitioned monthly (concept chapter 4). */
export const messageEvents = pgTable(
  "message_events",
  {
    id: id(),
    workspaceId: workspaceId(),
    messageId: uuid("message_id").notNull(),
    type: text("type").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: tz("occurred_at").notNull().defaultNow(),
  },
  (t) => [
    index("message_events_message_idx").on(t.messageId, t.occurredAt),
    index("message_events_ws_time_idx").on(t.workspaceId, t.occurredAt),
    foreignKey({
      name: "message_events_message_fk",
      columns: [t.workspaceId, t.messageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }).onDelete("cascade"),
  ],
);

export const attachments = pgTable(
  "attachments",
  {
    id: id(),
    workspaceId: workspaceId(),
    messageId: uuid("message_id").notNull(),
    fileId: uuid("file_id").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("attachments_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "attachments_message_fk",
      columns: [t.workspaceId, t.messageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "attachments_file_fk",
      columns: [t.workspaceId, t.fileId],
      foreignColumns: [files.workspaceId, files.id],
    }),
  ],
);

export const links = pgTable(
  "links",
  {
    id: id(),
    workspaceId: workspaceId(),
    messageId: uuid("message_id").notNull(),
    originalUrl: text("original_url").notNull(),
    token: text("token").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("links_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("links_token_uq").on(t.token),
    foreignKey({
      name: "links_message_fk",
      columns: [t.workspaceId, t.messageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }).onDelete("cascade"),
  ],
);

export const linkClicks = pgTable(
  "link_clicks",
  {
    id: id(),
    workspaceId: workspaceId(),
    linkId: uuid("link_id").notNull(),
    clickedAt: tz("clicked_at").notNull().defaultNow(),
    ipHash: text("ip_hash"),
  },
  (t) => [
    foreignKey({
      name: "link_clicks_link_fk",
      columns: [t.workspaceId, t.linkId],
      foreignColumns: [links.workspaceId, links.id],
    }).onDelete("cascade"),
    index("link_clicks_time_idx").on(t.clickedAt),
  ],
);

export const approvals = pgTable(
  "approvals",
  {
    id: id(),
    workspaceId: workspaceId(),
    kind: approvalKind("kind").notNull(),
    objectType: text("object_type").notNull(),
    objectId: uuid("object_id").notNull(),
    requestedByType: actorType("requested_by_type").notNull(),
    requestedById: text("requested_by_id"),
    summary: jsonb("summary").$type<Record<string, unknown>>().notNull().default({}),
    status: approvalStatus("status").notNull().default("pending"),
    decidedBy: uuid("decided_by").references(() => user.id, { onDelete: "set null" }),
    decidedAt: tz("decided_at"),
    decisionNote: text("decision_note"),
    expiresAt: tz("expires_at").notNull(),
    remindedAt: tz("reminded_at"),
    ...timestamps(),
  },
  (t) => [
    unique("approvals_ws_id_uq").on(t.workspaceId, t.id),
    index("approvals_ws_status_idx").on(t.workspaceId, t.status),
    index("approvals_expires_idx").on(t.expiresAt).where(sql`${t.status} = 'pending'`),
  ],
);

/** Source of "Wartet auf dich" (concept chapter 4). */
export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    workspaceId: workspaceId(),
    kind: taskKind("kind").notNull(),
    objectType: text("object_type"),
    objectId: uuid("object_id"),
    status: taskStatus("status").notNull().default("open"),
    priority: smallint("priority").notNull().default(2),
    /** Parameters for the UI text (never mail contents). */
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    /** Prevents duplicate open tasks for the same cause. */
    dedupeKey: text("dedupe_key"),
    dueAt: tz("due_at"),
    assignedUserId: uuid("assigned_user_id").references(() => user.id, { onDelete: "set null" }),
    resolvedAt: tz("resolved_at"),
    ...timestamps(),
  },
  (t) => [
    unique("tasks_ws_id_uq").on(t.workspaceId, t.id),
    index("tasks_open_idx").on(t.workspaceId, t.createdAt).where(sql`${t.status} = 'open'`),
    uniqueIndex("tasks_open_dedupe_uq")
      .on(t.workspaceId, t.dedupeKey)
      .where(sql`${t.status} = 'open'`),
  ],
);
