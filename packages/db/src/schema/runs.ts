/** Area D (part) – agent runs and their steps: complete protocol of every agent step (concept chapter 11). */
import {
  bigint,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps, tz } from "./_common";
import { agents, conversations } from "./agents";
import { agentRunStatus, agentRunStepType, agentRunTrigger, policyDecision } from "./enums";
import { workspaceId } from "./workspaces";

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: id(),
    workspaceId: workspaceId(),
    agentId: uuid("agent_id").notNull(),
    conversationId: uuid("conversation_id"),
    trigger: agentRunTrigger("trigger").notNull(),
    /** E.g. the inbound message id for `inbound_reply` runs. */
    triggerRef: text("trigger_ref"),
    status: agentRunStatus("status").notNull().default("queued"),
    model: text("model"),
    promptVersion: text("prompt_version"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    /** Cost in millionths of a euro cent (1 € = 10^8). bigint – no overflow for long runs. */
    costMicroCents: bigint("cost_micro_cents", { mode: "number" }).notNull().default(0),
    toolCallCount: integer("tool_call_count").notNull().default(0),
    pauseReason: text("pause_reason"),
    error: text("error"),
    startedAt: tz("started_at"),
    finishedAt: tz("finished_at"),
    ...timestamps(),
  },
  (t) => [
    unique("agent_runs_ws_id_uq").on(t.workspaceId, t.id),
    index("agent_runs_ws_agent_idx").on(t.workspaceId, t.agentId, t.createdAt),
    foreignKey({
      name: "agent_runs_agent_fk",
      columns: [t.workspaceId, t.agentId],
      foreignColumns: [agents.workspaceId, agents.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "agent_runs_conversation_fk",
      columns: [t.workspaceId, t.conversationId],
      foreignColumns: [conversations.workspaceId, conversations.id],
    }).onDelete("cascade"),
  ],
);

export const agentRunSteps = pgTable(
  "agent_run_steps",
  {
    id: id(),
    workspaceId: workspaceId(),
    runId: uuid("run_id").notNull(),
    position: integer("position").notNull(),
    type: agentRunStepType("type").notNull(),
    toolName: text("tool_name"),
    /** Inputs and outputs are cleared after 12 months (concept chapter 17). */
    input: jsonb("input").$type<unknown>(),
    output: jsonb("output").$type<unknown>(),
    policyDecision: policyDecision("policy_decision"),
    policyReason: text("policy_reason"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    /** Cost in millionths of a euro cent, like agent_runs.cost_micro_cents. */
    costMicroCents: bigint("cost_micro_cents", { mode: "number" }).notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    unique("agent_run_steps_ws_id_uq").on(t.workspaceId, t.id),
    index("agent_run_steps_run_idx").on(t.runId, t.position),
    foreignKey({
      name: "agent_run_steps_run_fk",
      columns: [t.workspaceId, t.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("cascade"),
  ],
);
