import "server-only";
import { createLogger, type Logger } from "@ep/core";
import { type CoreRuntime, createCoreRuntime } from "@ep/core/runtime";
import { createSystemMailer, type SystemMailer } from "@ep/mail";
import { webEnv } from "./env";

interface WebRuntime {
  core: CoreRuntime;
  mailer: SystemMailer;
  logger: Logger;
}

const globalForRuntime = globalThis as unknown as { __epWebRuntime?: WebRuntime };

/** One runtime per server process (survives hot reloads in development). */
export function runtime(): WebRuntime {
  if (!globalForRuntime.__epWebRuntime) {
    const env = webEnv();
    globalForRuntime.__epWebRuntime = {
      core: createCoreRuntime(env, { applicationName: "emailplattform-web", dbPoolSize: 10 }),
      mailer: createSystemMailer(env.SYSTEM_MAIL_SMTP_URL, env.SYSTEM_MAIL_FROM, {
        mode: env.MAIL_SEND_MODE,
        allowlist: env.MAIL_ALLOWLIST,
        sandboxHosts: env.SANDBOX_MAIL_HOSTS,
      }),
      logger: createLogger("web", env.LOG_LEVEL),
    };
  }
  return globalForRuntime.__epWebRuntime;
}
