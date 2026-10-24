import { describe, expect, it } from "vitest";
import { baseEnvSchema, checkSendModeSafety, EnvError, envForApp, loadEnv } from "./env";

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

describe("secret separation between apps (concept chapter 16)", () => {
  it("refuses to start the web app when the master key is present", () => {
    expect(() => loadEnv(baseEnvSchema, { ...valid, MASTER_KEY: key }, "web")).toThrow(
      /MASTER_KEY: must not be available/,
    );
    expect(() => loadEnv(baseEnvSchema, { ...valid, SEALED_BOX_SECRET_KEY: key }, "web")).toThrow(
      EnvError,
    );
    expect(() =>
      loadEnv(baseEnvSchema, { ...valid, BETTER_AUTH_SECRET: "x".repeat(40) }, "edge"),
    ).toThrow(EnvError);
    expect(loadEnv(baseEnvSchema, valid, "web").MAIL_SEND_MODE).toBe("sandbox");
  });

  it("filters the environment per app", () => {
    const all = {
      ...valid,
      MASTER_KEY: key,
      SEALED_BOX_SECRET_KEY: key,
      BETTER_AUTH_SECRET: "s".repeat(40),
      PATH: "/bin",
    };
    expect(Object.keys(envForApp("web", all))).not.toContain("MASTER_KEY");
    expect(Object.keys(envForApp("web", all))).not.toContain("SEALED_BOX_SECRET_KEY");
    expect(Object.keys(envForApp("web", all))).toContain("BETTER_AUTH_SECRET");
    expect(Object.keys(envForApp("worker", all))).toContain("MASTER_KEY");
    expect(Object.keys(envForApp("worker", all))).not.toContain("BETTER_AUTH_SECRET");
    expect(Object.keys(envForApp("edge", all))).toEqual(
      expect.arrayContaining(["PATH", "DATABASE_URL"]),
    );
  });
});

describe("sandbox endpoints", () => {
  it("must be host:port entries", () => {
    expect(
      loadEnv(baseEnvSchema, { ...valid, SANDBOX_MAIL_ENDPOINTS: "127.0.0.1:54025, Mailpit:1025" })
        .SANDBOX_MAIL_ENDPOINTS,
    ).toEqual(["127.0.0.1:54025", "mailpit:1025"]);
    expect(() => loadEnv(baseEnvSchema, { ...valid, SANDBOX_MAIL_ENDPOINTS: "127.0.0.1" })).toThrow(
      /host:port/,
    );
    expect(() =>
      loadEnv(baseEnvSchema, { ...valid, SANDBOX_MAIL_ENDPOINTS: "smtp.gmail.com" }),
    ).toThrow(EnvError);
  });
});
