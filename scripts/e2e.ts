/**
 * `pnpm test:e2e` – Playwright against web, edge and worker on the test stack.
 * Uses its own database (emailplattform_e2e), Valkey prefix and ports, so it can run next to
 * `pnpm dev`. MAIL_SEND_MODE stays sandbox: system mails go to the test Mailpit only.
 */
import { spawn } from "node:child_process";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { runSeed } from "@ep/db/seed";
import { e2eDatabaseName, recreateDatabase, testKeys, testUrls } from "@ep/testing";
import { appPorts, assertPortsFree, infraUp, repoRoot } from "@ep/testing/infra";

await infraUp("test");
const databaseUrl = await recreateDatabase(e2eDatabaseName);
await runSeed(databaseUrl);
await assertPortsFree({ ...appPorts.e2e });

const { publicKey, privateKey } = generateKeyPairSync("x25519");
const ports = appPorts.e2e;
const env: NodeJS.ProcessEnv = {
  ...process.env,
  APP_ENV: "test",
  LOG_LEVEL: "warn",
  DATABASE_URL: databaseUrl,
  VALKEY_URL: testUrls.valkey,
  VALKEY_PREFIX: `e2e${randomBytes(3).toString("hex")}`,
  MAIL_SEND_MODE: "sandbox",
  MAIL_ALLOWLIST: "",
  SANDBOX_MAIL_ENDPOINTS: [testUrls.greenmail.smtp, testUrls.greenmail.smtps]
    .map((port) => `127.0.0.1:${port}`)
    .concat(`127.0.0.1:${new URL(testUrls.mailpitSmtp).port}`)
    .join(","),
  EMAIL_HASH_KEY: testKeys.emailHashKey,
  MASTER_KEY: testKeys.masterKey,
  MASTER_KEY_VERSION: "1",
  BETTER_AUTH_SECRET: testKeys.betterAuthSecret,
  SEALED_BOX_PUBLIC_KEY: Buffer.from(
    publicKey.export({ format: "jwk" }).x as string,
    "base64url",
  ).toString("base64"),
  SEALED_BOX_SECRET_KEY: Buffer.from(
    privateKey.export({ format: "jwk" }).d as string,
    "base64url",
  ).toString("base64"),
  WEB_URL: `http://127.0.0.1:${ports.web}`,
  EDGE_URL: `http://127.0.0.1:${ports.edge}`,
  WEB_HOST: "127.0.0.1",
  WEB_PORT: String(ports.web),
  EDGE_HOST: "127.0.0.1",
  EDGE_PORT: String(ports.edge),
  WORKER_HOST: "127.0.0.1",
  WORKER_PORT: String(ports.worker),
  SYSTEM_MAIL_SMTP_URL: testUrls.mailpitSmtp,
  SYSTEM_MAIL_FROM: "E-Mail-Plattform <no-reply@plattform.test>",
  PASSWORD_BREACH_CHECK: "off",
  AUTH_RATE_LIMIT: "off",
  STORAGE_DRIVER: "fs",
  STORAGE_FS_ROOT: resolve(repoRoot, ".data/e2e-storage"),
  EDGE_BUFFER_DIR: resolve(repoRoot, ".data/e2e-edge-buffer"),
  RSPAMD_URL: testUrls.rspamd,
  CHECK_ADDRESS: "pruefadresse@plattform.test",
  NEXT_DIST_DIR: ".next-e2e",
  E2E_MAILPIT_API: testUrls.mailpitApi,
  E2E_DATABASE_URL: databaseUrl,
};

const child = spawn("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2)], {
  cwd: repoRoot,
  stdio: "inherit",
  env,
});
child.on("exit", (code) => process.exit(code ?? 1));
