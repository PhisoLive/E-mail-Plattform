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
  /**
   * `host:port` endpoints of the mail sandboxes (GreenMail SMTP/SMTPS, Mailpit). In sandbox mode
   * mails may only be handed to exactly these endpoints. Empty = nothing can be sent.
   */
  SANDBOX_MAIL_ENDPOINTS: csvList(),
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

/**
 * Mail sandboxes run locally: loopback addresses or single-label Compose service names such as
 * `greenmail` or `mailpit`. A real SMTP host (anything with a dot) is never a sandbox.
 */
export function isLocalSandboxHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  if (normalized === "localhost" || normalized === "::1" || normalized === "[::1]") return true;
  if (/^127(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(normalized)) return true;
  return /^[a-z][a-z0-9-]{0,62}$/.test(normalized);
}

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
  env: Pick<BaseEnv, "APP_ENV" | "MAIL_SEND_MODE" | "MAIL_ALLOWLIST"> & {
    SANDBOX_MAIL_ENDPOINTS?: string[];
  },
): string[] {
  const issues: string[] = [];
  for (const endpoint of env.SANDBOX_MAIL_ENDPOINTS ?? []) {
    const safe = endpoint.replace(/[^a-z0-9.:-]/g, "?");
    if (!/^[a-z0-9.-]+:\d{1,5}$/.test(endpoint)) {
      issues.push(`SANDBOX_MAIL_ENDPOINTS entries must be host:port (got "${safe}")`);
    } else if (!isLocalSandboxHost(endpoint.slice(0, endpoint.lastIndexOf(":")))) {
      issues.push(
        `SANDBOX_MAIL_ENDPOINTS may only name local sandboxes (loopback or Compose service names), got "${safe}"`,
      );
    }
  }
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

export type AppName = "web" | "edge" | "worker";

/**
 * Secrets an app must never receive (concept chapter 16): only the worker holds the master key,
 * the sealed-box secret key and the keys for S3 and the AI provider; the worker and the edge
 * service do not need the auth secret. An app refuses to start when one of them is set.
 */
export const forbiddenSecrets: Record<AppName, readonly string[]> = {
  web: [
    "MASTER_KEY",
    "SEALED_BOX_SECRET_KEY",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "ANTHROPIC_API_KEY",
  ],
  edge: [
    "MASTER_KEY",
    "SEALED_BOX_SECRET_KEY",
    "BETTER_AUTH_SECRET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "ANTHROPIC_API_KEY",
  ],
  worker: ["BETTER_AUTH_SECRET"],
};

/** Tooling variables an app reads itself (build directory and E2E mode of the web app). */
const appTooling: Record<AppName, readonly string[]> = {
  web: ["NEXT_DIST_DIR", "E2E_WEB_MODE"],
  edge: [],
  worker: [],
};

function schemaKeys(app: AppName): string[] {
  const schema = { web: webEnvSchema, edge: edgeEnvSchema, worker: workerEnvSchema }[app];
  return Object.keys(schema.shape);
}

/**
 * Copy of an environment for one app: platform variables only from the app's own schema
 * (positive list), everything else of the platform removed. Variables the platform does not
 * know (PATH, HOME, NODE_OPTIONS, …) stay so the process can run.
 */
export function envForApp(
  app: AppName,
  source: Record<string, string | undefined>,
): Record<string, string> {
  const platform = new Set([
    ...schemaKeys("web"),
    ...schemaKeys("edge"),
    ...schemaKeys("worker"),
    ...Object.keys(toolingEnvSchema.shape),
  ]);
  const own = new Set([...schemaKeys(app), ...appTooling[app]]);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (platform.has(key) && !own.has(key)) continue;
    if (forbiddenSecrets[app].includes(key)) continue;
    result[key] = value;
  }
  return result;
}

/** Parses and validates the environment. Never prints values, only variable names. */
export function loadEnv<S extends z.ZodType<BaseEnv>>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
  app?: AppName,
): z.infer<S> {
  if (app) {
    const leaked = forbiddenSecrets[app].filter(
      (key) => source[key] !== undefined && source[key] !== "",
    );
    if (leaked.length > 0) {
      throw new EnvError(
        leaked.map((key) => `${key}: must not be available to the ${app} process`),
      );
    }
  }
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
    );
  }
  const issues = checkSendModeSafety(result.data);
  const relaxedEnv = result.data.APP_ENV === "development" || result.data.APP_ENV === "test";
  if (
    !relaxedEnv &&
    (result.data as { PASSWORD_BREACH_CHECK?: string }).PASSWORD_BREACH_CHECK === "off"
  ) {
    issues.push("PASSWORD_BREACH_CHECK=off is only allowed in development and test");
  }
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

/**
 * Variables of the local tooling (tests, E2E, dev scripts) – documented here and in
 * .env.example so every variable read anywhere in the repository is declared.
 */
export const toolingEnvSchema = z.object({
  /** Next.js build directory (E2E uses `.next-e2e` to run next to `pnpm dev`). */
  NEXT_DIST_DIR: z.string().optional(),
  /** `production` builds the web app for E2E (default in CI), `dev` uses `next dev`. */
  E2E_WEB_MODE: z.enum(["production", "dev"]).optional(),
  /** Mailpit API of the test stack, read by the E2E helpers. */
  E2E_MAILPIT_API: z.string().url().optional(),
  /** `1` saves full-page screenshots of every visited route to test-results/screens. */
  E2E_SCREENSHOTS: z.enum(["0", "1"]).optional(),
  /** E2E database, read by E2E checks of the audit log. */
  E2E_DATABASE_URL: z.string().url().optional(),
  /** Database of the current test run (set by the Vitest global setup). */
  TEST_DATABASE_URL: z.string().url().optional(),
  /** `1` skips starting the test stack (unit tests only). */
  SKIP_TEST_INFRA: z.enum(["0", "1"]).optional(),
  /** Mailpit and GreenMail APIs of the dev stack (local tools only). */
  MAILPIT_API_URL: z.string().url().optional(),
  GREENMAIL_API_URL: z.string().url().optional(),
  /** Generated dev database password (compose dev stack). */
  DEV_POSTGRES_PASSWORD: z.string().optional(),
});
