import { z } from "zod";

/**
 * All environment variables of the platform. Every variable is declared here with a
 * Zod schema and documented in `.env.example` (concept chapter 3).
 */

export const appEnvSchema = z.enum(["development", "test", "staging", "production"]);
export type AppEnv = z.infer<typeof appEnvSchema>;

/** Send switch (concept chapter 18). Default is always `sandbox`. */
export const mailSendModeSchema = z.enum(["sandbox", "allowlist", "live"]);
export type MailSendMode = z.infer<typeof mailSendModeSchema>;

const csvList = (fallback = "") =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0),
    );

const base64Key = (bytes: number) =>
  z
    .string()
    .min(1)
    .refine((value) => Buffer.from(value, "base64").length === bytes, {
      message: `must be ${bytes} bytes, base64 encoded`,
    });

const port = z.coerce.number().int().min(1).max(65535);

export const baseEnvSchema = z.object({
  APP_ENV: appEnvSchema.default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().url(),
  VALKEY_URL: z.string().url(),
  /** Prefix for all Valkey keys and BullMQ queues – lets dev, test and e2e share one Valkey. */
  VALKEY_PREFIX: z.string().min(1).default("ep"),
  MAIL_SEND_MODE: mailSendModeSchema.default("sandbox"),
  /** Staging only: addresses or `@domain` entries that may receive real mails. */
  MAIL_ALLOWLIST: csvList(),
  /** Hosts that count as mail sandbox (GreenMail, Mailpit). Only these accept mail in sandbox mode. */
  SANDBOX_MAIL_HOSTS: csvList("127.0.0.1,localhost,greenmail,mailpit"),
  /** HMAC key for `email_hash` (concept chapter 7). Never rotated. */
  EMAIL_HASH_KEY: base64Key(32),
  /** Public base URL of the web app. */
  WEB_URL: z.string().url(),
  /** Public base URL of the edge service (unsubscribe, clicks, webhooks). */
  EDGE_URL: z.string().url(),
});

export const webEnvSchema = baseEnvSchema.extend({
  WEB_HOST: z.string().default("127.0.0.1"),
  WEB_PORT: port.default(4300),
  BETTER_AUTH_SECRET: z.string().min(32),
  /** X25519 public key of the worker (sealed box) – the web app can only encrypt. */
  SEALED_BOX_PUBLIC_KEY: base64Key(32),
  SYSTEM_MAIL_SMTP_URL: z.string().url(),
  SYSTEM_MAIL_FROM: z.string().min(3),
  /** k-anonymity check against known leaked passwords (Have I Been Pwned). */
  PASSWORD_BREACH_CHECK: z.enum(["on", "off"]).default("on"),
  /** Disable auth rate limits (only allowed in the test environment). */
  AUTH_RATE_LIMIT: z.enum(["on", "off"]).default("on"),
});

export const workerEnvSchema = baseEnvSchema.extend({
  WORKER_HOST: z.string().default("127.0.0.1"),
  WORKER_PORT: port.default(4302),
  /** Master key for envelope encryption. Never in the database, never in the web app. */
  MASTER_KEY: base64Key(32),
  MASTER_KEY_VERSION: z.coerce.number().int().min(1).default(1),
  SEALED_BOX_PUBLIC_KEY: base64Key(32),
  SEALED_BOX_SECRET_KEY: base64Key(32),
  SYSTEM_MAIL_SMTP_URL: z.string().url(),
  SYSTEM_MAIL_FROM: z.string().min(3),
  STORAGE_DRIVER: z.enum(["fs", "s3"]).default("fs"),
  STORAGE_FS_ROOT: z.string().default(".data/storage"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RSPAMD_URL: z.string().url().optional(),
  CLAMAV_HOST: z.string().optional(),
  CLAMAV_PORT: port.optional(),
  /** Platform check address that receives connection test mails (concept chapter 5). */
  CHECK_ADDRESS: z.string().email().optional(),
  WORKER_QUEUES: csvList(),
});

export const edgeEnvSchema = baseEnvSchema.extend({
  EDGE_HOST: z.string().default("127.0.0.1"),
  EDGE_PORT: port.default(4301),
  EDGE_BUFFER_DIR: z.string().default(".data/edge-buffer"),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type EdgeEnv = z.infer<typeof edgeEnvSchema>;

export class EnvError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "EnvError";
  }
}

/**
 * Safety rules for the send switch (concept chapter 18, CLAUDE.md):
 * `live` only in production, `allowlist` needs a non-empty allowlist.
 */
export function checkSendModeSafety(
  env: Pick<BaseEnv, "APP_ENV" | "MAIL_SEND_MODE" | "MAIL_ALLOWLIST">,
): string[] {
  const issues: string[] = [];
  if (env.MAIL_SEND_MODE === "live" && env.APP_ENV !== "production") {
    issues.push(`MAIL_SEND_MODE=live is only allowed with APP_ENV=production (got ${env.APP_ENV})`);
  }
  if (env.MAIL_SEND_MODE === "allowlist" && env.MAIL_ALLOWLIST.length === 0) {
    issues.push("MAIL_SEND_MODE=allowlist requires a non-empty MAIL_ALLOWLIST");
  }
  if (env.APP_ENV === "development" || env.APP_ENV === "test") {
    if (env.MAIL_SEND_MODE !== "sandbox") {
      issues.push(`MAIL_SEND_MODE must be sandbox in ${env.APP_ENV}`);
    }
  }
  return issues;
}

/** Parses and validates the environment. Never prints values, only variable names. */
export function loadEnv<S extends z.ZodType<BaseEnv>>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): z.infer<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
    );
  }
  const issues = checkSendModeSafety(result.data);
  if (result.data.APP_ENV !== "test" && "AUTH_RATE_LIMIT" in result.data) {
    if ((result.data as { AUTH_RATE_LIMIT?: string }).AUTH_RATE_LIMIT === "off") {
      issues.push("AUTH_RATE_LIMIT=off is only allowed with APP_ENV=test");
    }
  }
  if (issues.length > 0) {
    throw new EnvError(issues);
  }
  return result.data;
}
