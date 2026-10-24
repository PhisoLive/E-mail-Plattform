/** Area B (part) – deliverability checks and inbox tests (concept chapters 4 and 12). */
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_common";
import { campaigns } from "./campaigns";
import {
  checkStatus,
  deliverabilityCheckKind,
  deliverabilitySubject,
  inboxTestStatus,
  placement,
} from "./enums";
import { mailboxes, seedAccounts } from "./mailboxes";
import { workspaceId } from "./workspaces";

export const deliverabilityChecks = pgTable(
  "deliverability_checks",
  {
    id: id(),
    workspaceId: workspaceId(),
    subjectType: deliverabilitySubject("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    kind: deliverabilityCheckKind("kind").notNull(),
    status: checkStatus("status").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull().default({}),
    score: real("score"),
    ...timestamps(),
  },
  (t) => [
    unique("deliverability_checks_ws_id_uq").on(t.workspaceId, t.id),
    index("deliverability_checks_subject_idx").on(
      t.workspaceId,
      t.subjectType,
      t.subjectId,
      t.createdAt,
    ),
  ],
);

export const inboxTests = pgTable(
  "inbox_tests",
  {
    id: id(),
    workspaceId: workspaceId(),
    mailboxId: uuid("mailbox_id").notNull(),
    campaignId: uuid("campaign_id"),
    status: inboxTestStatus("status").notNull().default("pending"),
    rfcMessageId: text("rfc_message_id"),
    contentScore: real("content_score"),
    summary: jsonb("summary").$type<Record<string, unknown>>(),
    ...timestamps(),
  },
  (t) => [
    unique("inbox_tests_ws_id_uq").on(t.workspaceId, t.id),
    foreignKey({
      name: "inbox_tests_mailbox_fk",
      columns: [t.workspaceId, t.mailboxId],
      foreignColumns: [mailboxes.workspaceId, mailboxes.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "inbox_tests_campaign_fk",
      columns: [t.workspaceId, t.campaignId],
      foreignColumns: [campaigns.workspaceId, campaigns.id],
    }).onDelete("cascade"),
  ],
);

export const inboxTestResults = pgTable(
  "inbox_test_results",
  {
    id: id(),
    workspaceId: workspaceId(),
    inboxTestId: uuid("inbox_test_id").notNull(),
    seedAccountId: uuid("seed_account_id").references(() => seedAccounts.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull(),
    placement: placement("placement").notNull(),
    auth: jsonb("auth").$type<Record<string, unknown>>(),
    latencySeconds: integer("latency_seconds"),
    ...timestamps(),
  },
  (t) => [
    foreignKey({
      name: "inbox_test_results_test_fk",
      columns: [t.workspaceId, t.inboxTestId],
      foreignColumns: [inboxTests.workspaceId, inboxTests.id],
    }).onDelete("cascade"),
    index("inbox_test_results_test_idx").on(t.inboxTestId),
  ],
);
