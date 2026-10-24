import { pgEnum } from "drizzle-orm/pg-core";

// A – accounts and workspaces
export const workspaceKind = pgEnum("workspace_kind", ["business", "private"]);
export const workspaceCountry = pgEnum("workspace_country", ["DE", "AT", "CH", "other"]);
export const trustLevel = pgEnum("trust_level", ["new", "verified", "established", "restricted"]);
export const memberRole = pgEnum("member_role", ["owner", "admin", "member", "viewer"]);
export const actorType = pgEnum("actor_type", ["user", "agent", "system"]);
export const formality = pgEnum("formality", ["sie", "du", "auto"]);

// B – mailboxes and domains
export const mailboxProvider = pgEnum("mailbox_provider", [
  "gmail_api",
  "microsoft_graph",
  "imap_smtp",
  "platform",
]);
export const mailboxStatus = pgEnum("mailbox_status", [
  "connecting",
  "warming",
  "active",
  "paused",
  "needs_reauth",
  "error",
  "disconnected",
]);
export const connectionSecurity = pgEnum("connection_security", ["tls", "starttls", "none"]);
export const mailboxProfile = pgEnum("mailbox_profile", ["new", "established"]);
export const secretKind = pgEnum("secret_kind", ["oauth", "password", "app_password", "api_key"]);
export const domainOwnership = pgEnum("domain_ownership", ["customer", "platform", "provider"]);
export const checkStatus = pgEnum("check_status", ["pending", "pass", "warn", "fail"]);
export const deliverabilitySubject = pgEnum("deliverability_subject", [
  "domain",
  "mailbox",
  "campaign",
]);
export const deliverabilityCheckKind = pgEnum("deliverability_check_kind", [
  "dns",
  "blocklist",
  "content",
  "auth_headers",
]);
export const inboxTestStatus = pgEnum("inbox_test_status", [
  "pending",
  "sending",
  "waiting",
  "completed",
  "failed",
]);
export const placement = pgEnum("placement", ["inbox", "promotions", "spam", "missing"]);

// C – contacts
export const salutation = pgEnum("salutation", ["herr", "frau", "divers", "none"]);
export const contactStatus = pgEnum("contact_status", [
  "active",
  "unsubscribed",
  "bounced",
  "complained",
  "invalid",
]);
export const verificationStatus = pgEnum("verification_status", [
  "valid",
  "risky",
  "invalid",
  "unknown",
]);
export const legalBasis = pgEnum("legal_basis", [
  "consent",
  "existing_customer",
  "contract",
  "legitimate_interest",
  "unknown",
]);
export const listKind = pgEnum("list_kind", ["static", "dynamic"]);
export const importStatus = pgEnum("import_status", [
  "uploaded",
  "mapping",
  "validating",
  "ready",
  "importing",
  "completed",
  "failed",
  "cancelled",
]);
export const suppressionReason = pgEnum("suppression_reason", [
  "unsubscribed",
  "hard_bounce",
  "repeated_soft_bounce",
  "complaint",
  "manual",
  "reply_optout",
]);
export const globalSuppressionReason = pgEnum("global_suppression_reason", [
  "hard_bounce",
  "spamtrap",
]);

// D – agents and AI
export const agentRoleTemplate = pgEnum("agent_role_template", [
  "allround",
  "acquisition",
  "support",
  "reminders",
  "events",
  "custom",
]);
export const autonomy = pgEnum("autonomy", ["auto", "draft_first", "approve_new_recipients"]);
export const modelProfile = pgEnum("model_profile", ["economy", "standard", "premium"]);
export const knowledgeKind = pgEnum("knowledge_kind", ["text", "file", "url", "faq"]);
export const styleRuleOrigin = pgEnum("style_rule_origin", ["user_edit", "explicit"]);
export const conversationRole = pgEnum("conversation_role", ["user", "assistant"]);
export const agentRunTrigger = pgEnum("agent_run_trigger", [
  "chat",
  "schedule",
  "inbound_reply",
  "campaign_step",
  "system",
]);
export const agentRunStatus = pgEnum("agent_run_status", [
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
]);
export const agentRunStepType = pgEnum("agent_run_step_type", ["llm", "tool"]);
export const policyDecision = pgEnum("policy_decision", ["allowed", "denied", "needs_approval"]);

// E – campaigns and messages
export const campaignKind = pgEnum("campaign_kind", ["single", "bulk", "sequence", "newsletter"]);
export const campaignPurpose = pgEnum("campaign_purpose", [
  "advertising",
  "transactional",
  "personal",
]);
export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "planning",
  "ready",
  "pending_approval",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled",
  "failed",
]);
export const personalizationLevel = pgEnum("personalization_level", [
  "variables",
  "ai_opening",
  "ai_full",
]);
export const stepKind = pgEnum("step_kind", ["email", "wait"]);
export const delayUnit = pgEnum("delay_unit", ["business_days", "days", "hours"]);
export const recipientStatus = pgEnum("recipient_status", [
  "pending",
  "active",
  "paused",
  "replied",
  "completed",
  "bounced",
  "unsubscribed",
  "skipped",
  "failed",
]);
export const threadCategory = pgEnum("thread_category", [
  "important",
  "needs_reply",
  "done",
  "info",
  "bounce",
  "auto",
]);
export const messageDirection = pgEnum("message_direction", ["outbound", "inbound"]);
export const messageStatus = pgEnum("message_status", [
  "draft",
  "pending_approval",
  "scheduled",
  "queued",
  "sending",
  "sent",
  "failed",
  "skipped",
  "cancelled",
  "uncertain",
  "received",
]);
export const audienceType = pgEnum("audience_type", ["cold", "warm", "reply"]);
export const approvalKind = pgEnum("approval_kind", [
  "campaign_start",
  "message_send",
  "reply_send",
  "mailbox_purchase",
]);
export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export const taskKind = pgEnum("task_kind", [
  "approval",
  "mailbox_reauth",
  "dns_degraded",
  "important_reply",
  "uncertain_send",
  "data_request",
  "hint",
]);
export const taskStatus = pgEnum("task_status", ["open", "done", "dismissed"]);

// F – billing and usage
export const usageKind = pgEnum("usage_kind", [
  "email_sent",
  "ai_tokens",
  "ai_cost",
  "inbox_test",
  "verification",
  "mailbox_purchased",
  "domain_purchased",
  "stt_seconds",
]);
/** Mirror of the Stripe subscription status. */
export const subscriptionStatus = pgEnum("subscription_status", [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
]);
export const platformDomainMode = pgEnum("platform_domain_mode", ["dedicated", "shared_subdomain"]);

// G – files, notifications, integrations
export const filePurpose = pgEnum("file_purpose", [
  "import",
  "attachment",
  "voice",
  "knowledge",
  "export",
  "raw_mail",
]);
export const scanStatus = pgEnum("scan_status", [
  "pending",
  "clean",
  "infected",
  "error",
  "skipped",
]);
export const channelKind = pgEnum("channel_kind", ["telegram", "whatsapp"]);
export const integrationKind = pgEnum("integration_kind", [
  "lexware_office",
  "sevdesk",
  "hubspot",
  "pipedrive",
  "google_sheets",
]);

// H – operations and abuse
export const abuseStatus = pgEnum("abuse_status", ["open", "reviewing", "actioned", "dismissed"]);
export const featureFlagScope = pgEnum("feature_flag_scope", ["platform", "workspace"]);
