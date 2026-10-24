/** Area F – plans, subscriptions and usage (concept chapters 4 and 14). Prices stay open. */
import {
  bigint,
  boolean,
  date,
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
import { id, timestamps, tz } from "./_common";
import { platformDomainMode, subscriptionStatus, usageKind } from "./enums";
import { mailboxes } from "./mailboxes";
import { workspaceId, workspaces } from "./workspaces";

export interface PlanLimits {
  mailboxes: number;
  emailsPerMonth: number;
  aiBudgetCents: number;
  agents: number;
  seats: number;
  inboxTestsPerMonth: number;
  contacts: number;
  features: string[];
}

export const plans = pgTable("plans", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  limits: jsonb("limits").$type<PlanLimits>().notNull(),
  stripePriceIds: jsonb("stripe_price_ids").$type<Record<string, string>>().notNull().default({}),
  active: boolean("active").notNull().default(true),
  ...timestamps(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: id(),
    workspaceId: workspaceId(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    planCode: text("plan_code")
      .notNull()
      .references(() => plans.code),
    status: subscriptionStatus("status").notNull(),
    currentPeriodEnd: tz("current_period_end"),
    ...timestamps(),
  },
  (t) => [
    unique("subscriptions_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("subscriptions_stripe_uq").on(t.stripeSubscriptionId),
  ],
);

/** Exactly one event per billable action – `dedupe_key` prevents double counting. */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: id(),
    workspaceId: workspaceId(),
    kind: usageKind("kind").notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    dedupeKey: text("dedupe_key").notNull(),
    occurredAt: tz("occurred_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("usage_events_dedupe_uq").on(t.workspaceId, t.dedupeKey),
    index("usage_events_ws_time_idx").on(t.workspaceId, t.kind, t.occurredAt),
  ],
);

export const usageMonthly = pgTable(
  "usage_monthly",
  {
    workspaceId: workspaceId(),
    month: date("month", { mode: "string" }).notNull(),
    kind: usageKind("kind").notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull().default(0),
    costCents: bigint("cost_cents", { mode: "number" }).notNull().default(0),
    ...timestamps(),
  },
  (t) => [primaryKey({ name: "usage_monthly_pk", columns: [t.workspaceId, t.month, t.kind] })],
);

/** From phase 12. */
export const platformDomains = pgTable("platform_domains", {
  id: id(),
  name: text("name").notNull().unique(),
  registrarRef: text("registrar_ref"),
  ownerWorkspaceId: uuid("owner_workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  mode: platformDomainMode("mode").notNull(),
  expiresAt: tz("expires_at"),
  ...timestamps(),
});

/** From phase 12. */
export const purchasedMailboxes = pgTable(
  "purchased_mailboxes",
  {
    id: id(),
    workspaceId: workspaceId(),
    mailboxId: uuid("mailbox_id").notNull(),
    serverAccountRef: text("server_account_ref"),
    stripeItemId: text("stripe_item_id"),
    ...timestamps(),
  },
  (t) => [
    foreignKey({
      name: "purchased_mailboxes_mailbox_fk",
      columns: [t.workspaceId, t.mailboxId],
      foreignColumns: [mailboxes.workspaceId, mailboxes.id],
    }).onDelete("cascade"),
  ],
);
