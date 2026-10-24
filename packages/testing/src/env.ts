import { stacks, testDatabasePassword } from "./infra/stacks";

const ports = stacks.test.ports;

export const testDatabaseName = "emailplattform_test";
export const e2eDatabaseName = "emailplattform_e2e";

export const testUrls = {
  adminDatabase: `postgres://emailplattform:${testDatabasePassword}@127.0.0.1:${ports.pg}/emailplattform`,
  database: (name = testDatabaseName) =>
    `postgres://emailplattform:${testDatabasePassword}@127.0.0.1:${ports.pg}/${name}`,
  valkey: `redis://127.0.0.1:${ports.valkey}`,
  greenmailApi: `http://127.0.0.1:${ports.gmApi}`,
  mailpitApi: `http://127.0.0.1:${ports.mailpitHttp}`,
  mailpitSmtp: `smtp://127.0.0.1:${ports.mailpitSmtp}`,
  rspamd: `http://127.0.0.1:${ports.rspamd}`,
  greenmail: {
    host: "127.0.0.1",
    smtp: ports.gmSmtp,
    smtps: ports.gmSmtps,
    imap: ports.gmImap,
    imaps: ports.gmImaps,
  },
};

/** Fixed, non-secret keys for tests only. */
export const testKeys = {
  emailHashKey: Buffer.alloc(32, 7).toString("base64"),
  masterKey: Buffer.alloc(32, 9).toString("base64"),
  betterAuthSecret: "test-only-better-auth-secret-0123456789abcdef",
};

export function testDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? testUrls.database();
}
