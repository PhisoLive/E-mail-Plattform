/** Area G (part) – files in object storage (concept chapter 4). */
import { bigint, index, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, timestamps, tz } from "./_common";
import { filePurpose, scanStatus } from "./enums";
import { workspaceId } from "./workspaces";

export const files = pgTable(
  "files",
  {
    id: id(),
    workspaceId: workspaceId(),
    storageKey: text("storage_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    sha256: text("sha256").notNull(),
    purpose: filePurpose("purpose").notNull(),
    scanStatus: scanStatus("scan_status").notNull().default("pending"),
    expiresAt: tz("expires_at"),
    ...timestamps(),
  },
  (t) => [
    unique("files_ws_id_uq").on(t.workspaceId, t.id),
    index("files_expires_idx").on(t.expiresAt),
  ],
);
