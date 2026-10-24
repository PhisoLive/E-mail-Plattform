/** Area C (part) – suppression lists (concept chapter 7). Never bypassable. */
import { foreignKey, integer, pgTable, text, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, tz } from "./_common";
import { messages } from "./campaigns";
import { citext } from "./contacts";
import { globalSuppressionReason, suppressionReason } from "./enums";
import { workspaceId } from "./workspaces";

/** One row per address and reason; lifting removes only that reason (concept chapter 7). */
export const suppressions = pgTable(
  "suppressions",
  {
    id: id(),
    workspaceId: workspaceId(),
    emailHash: text("email_hash").notNull(),
    /** Plain address – removed when the contact is deleted; the hash stays. */
    email: citext("email"),
    reason: suppressionReason("reason").notNull(),
    /** Mail that caused the entry (bounce, reply). The retention job clears it before deleting mails. */
    sourceMessageId: uuid("source_message_id"),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("suppressions_ws_id_uq").on(t.workspaceId, t.id),
    uniqueIndex("suppressions_ws_hash_reason_uq").on(t.workspaceId, t.emailHash, t.reason),
    foreignKey({
      name: "suppressions_source_message_fk",
      columns: [t.workspaceId, t.sourceMessageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }),
  ],
);

/** Platform-wide, only HMAC hashes (concept chapters 7 and 17). */
export const globalSuppressions = pgTable("global_suppressions", {
  emailHash: text("email_hash").primaryKey(),
  reason: globalSuppressionReason("reason").notNull(),
  firstSeenAt: tz("first_seen_at").notNull().defaultNow(),
  lastSeenAt: tz("last_seen_at").notNull().defaultNow(),
  count: integer("count").notNull().default(1),
});
