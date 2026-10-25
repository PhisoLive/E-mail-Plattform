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

/**
 * Values the UI text of a code needs (concept Anhang D: `{anzahl}`, `{limit}`). Thresholds from
 * defaults.ts are filled in by the UI. Never personal data or secrets.
 */
export interface ErrorParams {
  PREFLIGHT_PLACEHOLDER: { anzahl: number };
  SEND_UNVERIFIED: { anzahl: number };
  PLAN_LIMIT: { limit: string };
}
export type ErrorCodeWithParams = keyof ErrorParams;

export interface AppError {
  code: ErrorCode;
  /** Parameters for the UI text, see ErrorParams. */
  params?: Record<string, string | number>;
  /** Field errors for forms (field name → error code). */
  fields?: Record<string, string>;
}

/** Codes listed in ErrorParams can only be created with their values. */
export function appError<C extends ErrorCodeWithParams>(
  code: C,
  params: ErrorParams[C],
  fields?: AppError["fields"],
): AppError;
/** Other codes may carry diagnostic values (entity, state …) that their text does not show. */
export function appError(
  code: Exclude<ErrorCode, ErrorCodeWithParams>,
  params?: AppError["params"],
  fields?: AppError["fields"],
): AppError;
export function appError(
  code: ErrorCode,
  params?: Record<string, string | number>,
  fields?: AppError["fields"],
): AppError {
  const error: AppError = { code };
  if (params) error.params = params;
  if (fields) error.fields = fields;
  return error;
}
