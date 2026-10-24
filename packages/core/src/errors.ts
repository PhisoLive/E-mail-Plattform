/**
 * Error codes of the platform. The user-facing German text for each code lives in
 * apps/web/messages/de.json under `errors.<CODE>` – never in code (concept Anhang D).
 */
export const errorCodes = [
  // generic
  "VALIDATION",
  "NOT_FOUND",
  "FORBIDDEN",
  "UNAUTHENTICATED",
  "CONFLICT",
  "STATE_CHANGED",
  "INVALID_TRANSITION",
  "RATE_LIMITED",
  "INTERNAL",
  // auth and team
  "TWO_FACTOR_REQUIRED",
  "FRESH_LOGIN_REQUIRED",
  "EMAIL_NOT_VERIFIED",
  "INVITATION_INVALID",
  "INVITATION_EXPIRED",
  "INVITATION_EMAIL_MISMATCH",
  "ALREADY_MEMBER",
  "LAST_OWNER",
  "OWNER_PROTECTED",
  "SLUG_TAKEN",
  // Anhang D
  "MAILBOX_AUTH_FAILED",
  "MAILBOX_RATE_LIMITED",
  "RECIPIENT_SUPPRESSED",
  "PREFLIGHT_PLACEHOLDER",
  "PREFLIGHT_AUTH_MISSING",
  "AI_BUDGET_EXCEEDED",
  "TRUST_DAILY_LIMIT",
  "PLAN_LIMIT",
  "SEND_UNVERIFIED",
  "GRAPH_MESSAGE_TOO_LARGE",
  // send switch
  "SEND_BLOCKED_BY_MODE",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export interface AppError {
  code: ErrorCode;
  /** Parameters for the UI text, e.g. { anzahl: 3 }. Never personal data or secrets. */
  params?: Record<string, string | number>;
  /** Field errors for forms (field name → error code). */
  fields?: Record<string, string>;
}

export const appError = (
  code: ErrorCode,
  params?: AppError["params"],
  fields?: AppError["fields"],
): AppError => {
  const error: AppError = { code };
  if (params) error.params = params;
  if (fields) error.fields = fields;
  return error;
};
