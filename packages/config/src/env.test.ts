import { describe, expect, it } from "vitest";
import { baseEnvSchema, checkSendModeSafety, EnvError, loadEnv } from "./env";

const key = Buffer.alloc(32, 1).toString("base64");

const valid = {
  APP_ENV: "development",
  DATABASE_URL: "postgres://u:p@127.0.0.1:5432/db",
  VALKEY_URL: "redis://127.0.0.1:6379",
  EMAIL_HASH_KEY: key,
  WEB_URL: "http://127.0.0.1:4300",
  EDGE_URL: "http://127.0.0.1:4301",
};

describe("loadEnv", () => {
  it("defaults MAIL_SEND_MODE to sandbox", () => {
    const env = loadEnv(baseEnvSchema, valid);
    expect(env.MAIL_SEND_MODE).toBe("sandbox");
  });

  it("refuses live outside production", () => {
    expect(() => loadEnv(baseEnvSchema, { ...valid, MAIL_SEND_MODE: "live" })).toThrow(EnvError);
    expect(() =>
      loadEnv(baseEnvSchema, { ...valid, APP_ENV: "staging", MAIL_SEND_MODE: "live" }),
    ).toThrow(/only allowed with APP_ENV=production/);
  });

  it("requires an allowlist in allowlist mode", () => {
    expect(() =>
      loadEnv(baseEnvSchema, { ...valid, APP_ENV: "staging", MAIL_SEND_MODE: "allowlist" }),
    ).toThrow(/non-empty MAIL_ALLOWLIST/);
    const env = loadEnv(baseEnvSchema, {
      ...valid,
      APP_ENV: "staging",
      MAIL_SEND_MODE: "allowlist",
      MAIL_ALLOWLIST: " Test@Example.org, @firma.de ",
    });
    expect(env.MAIL_ALLOWLIST).toEqual(["test@example.org", "@firma.de"]);
  });

  it("forces sandbox in development and test", () => {
    expect(
      checkSendModeSafety({
        APP_ENV: "test",
        MAIL_SEND_MODE: "allowlist",
        MAIL_ALLOWLIST: ["a@b.c"],
      }),
    ).toHaveLength(1);
  });

  it("reports variable names but never values", () => {
    try {
      loadEnv(baseEnvSchema, { ...valid, EMAIL_HASH_KEY: "c2VjcmV0" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      expect(String(error)).toContain("EMAIL_HASH_KEY");
      expect(String(error)).not.toContain("c2VjcmV0");
    }
  });
});
