/** Area D – agents, knowledge, style rules and chats (concept chapters 4 and 11). */
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { deletedAt, id, timestamps, tz } from "./_common";
import { user } from "./auth";
import {
  agentRoleTemplate,
  autonomy,
  conversationRole,
  formality,
  knowledgeKind,
  modelProfile,
  styleRuleOrigin,
} from "./enums";
import { files } from "./files";
import { workspaceId } from "./workspaces";

export interface WorkingHours {
  days: number[];
  start: string;
  end: string;
}

export interface ReplyPolicy {
  /** Intents the agent may answer itself (concept chapter 10). */
  autoReplyIntents: string[];
  mode: "reply" | "draft" | "sort_only";
}

export const agents = pgTable(
  "agents",
  {
    id: id(),
    workspaceId: workspaceId(),
    name: text("name").notNull(),
    color: text("color").notNull().default("slate"),
    icon: text("icon").notNull().default("sparkles"),
    roleTemplate: agentRoleTemplate("role_template").notNull().default("allround"),
    instructions: text("instructions").notNull().default(""),
    tone: text("tone").notNull().default("friendly"),
    formalityDefault: formality("formality_default").notNull().default("sie"),
    languageDefault: text("language_default").notNull().default("de-DE"),
    autonomy: autonomy("autonomy").notNull().default("auto"),
    approvalThreshold: integer("approval_threshold").notNull(),
    allowedActions: text("allowed_actions").array().notNull(),
    /** Empty = all active mailboxes. */
    allowedMailboxIds: uuid("allowed_mailbox_ids").array().notNull().default([]),
    replyPolicy: jsonb("reply_policy").$type<ReplyPolicy>().notNull(),
    workingHours: jsonb("working_hours").$type<WorkingHours>().notNull(),
    dailySendCap: integer("daily_send_cap").notNull(),
    reportSchedule: jsonb("report_schedule")
      .$type<{ onCompletion: boolean; daily: boolean; weekly: boolean; time: string }>()
      .notNull(),
    modelProfile: modelProfile("model_profile").notNull().default("standard"),
    isDefault: boolean("is_default").notNull().default(false),
    pausedAt: tz("paused_at"),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [unique("agents_ws_id_uq").on(t.workspaceId, t.id)],
);

export const knowledgeItems = pgTable(
  "knowledge_items",
  {
    id: id(),
    workspaceId: workspaceId(),
    /** Null = available to all agents. */
    agentId: uuid("agent_id"),
    kind: knowledgeKind("kind").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    fileId: uuid("file_id"),
    url: text("url"),
    tokenCount: integer("token_count").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    unique("knowledge_items_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "knowledge_items_agent_fk",
      columns: [t.workspaceId, t.agentId],
      foreignColumns: [agents.workspaceId, agents.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "knowledge_items_file_fk",
      columns: [t.workspaceId, t.fileId],
      foreignColumns: [files.workspaceId, files.id],
    }),
  ],
);

export const styleRules = pgTable(
  "style_rules",
  {
    id: id(),
    workspaceId: workspaceId(),
    agentId: uuid("agent_id").notNull(),
    rule: text("rule").notNull(),
    origin: styleRuleOrigin("origin").notNull(),
    /** Active only after the user confirmed it (concept chapter 11). */
    confirmedAt: tz("confirmed_at"),
    rejectedAt: tz("rejected_at"),
    ...timestamps(),
  },
  (t) => [
    unique("style_rules_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "style_rules_agent_fk",
      columns: [t.workspaceId, t.agentId],
      foreignColumns: [agents.workspaceId, agents.id],
    }).onDelete("cascade"),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: id(),
    workspaceId: workspaceId(),
    agentId: uuid("agent_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    lastMessageAt: tz("last_message_at"),
    ...timestamps(),
  },
  (t) => [
    unique("conversations_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "conversations_agent_fk",
      columns: [t.workspaceId, t.agentId],
      foreignColumns: [agents.workspaceId, agents.id],
    }).onDelete("cascade"),
    index("conversations_ws_user_idx").on(t.workspaceId, t.userId, t.lastMessageAt),
  ],
);

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: id(),
    workspaceId: workspaceId(),
    conversationId: uuid("conversation_id").notNull(),
    role: conversationRole("role").notNull(),
    /** Content blocks and cards (concept chapter 11). */
    content: jsonb("content").$type<unknown[]>().notNull(),
    toolCalls: jsonb("tool_calls").$type<unknown[]>(),
    attachments: jsonb("attachments").$type<{ fileId: string; filename: string }[]>(),
    voiceTranscript: text("voice_transcript"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    ...timestamps(),
  },
  (t) => [
    unique("conversation_messages_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "conversation_messages_conversation_fk",
      columns: [t.workspaceId, t.conversationId],
      foreignColumns: [conversations.workspaceId, conversations.id],
    }).onDelete("cascade"),
    index("conversation_messages_conv_idx").on(t.conversationId, t.createdAt),
  ],
);
