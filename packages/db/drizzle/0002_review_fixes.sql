CREATE TYPE "public"."subscription_status" AS ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');--> statement-breakpoint
DROP INDEX "feature_flags_key_scope_ws_uq";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "agent_run_steps" ALTER COLUMN "cost_micro_cents" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "agent_runs" ALTER COLUMN "cost_micro_cents" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "suppressions" ADD CONSTRAINT "suppressions_source_message_fk" FOREIGN KEY ("workspace_id","source_message_id") REFERENCES "public"."messages"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abuse_reports" ADD CONSTRAINT "abuse_reports_mailbox_fk" FOREIGN KEY ("workspace_id","mailbox_id") REFERENCES "public"."mailboxes"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abuse_reports" ADD CONSTRAINT "abuse_reports_message_fk" FOREIGN KEY ("workspace_id","message_id") REFERENCES "public"."messages"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_key_scope_ws_uq" UNIQUE NULLS NOT DISTINCT("key","scope","workspace_id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_priority_range" CHECK ("messages"."priority" between 1 and 4);