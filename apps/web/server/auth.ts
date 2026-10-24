import "server-only";
import { passkey as passkeyPlugin } from "@better-auth/passkey";
import { defaults } from "@ep/config/defaults";
import { emailHash, ipHash } from "@ep/core";
import {
  type AuthAuditAction,
  isTwoFactorEnabledForEmail,
  recordAuthEvent,
} from "@ep/core/system/accounts";
import { account, passkey, session, twoFactor, user, verification } from "@ep/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";
import { magicLink } from "better-auth/plugins/magic-link";
import { twoFactor as twoFactorPlugin } from "better-auth/plugins/two-factor";
import { appTranslator, emailTranslator, sanitizeDisplayName } from "./email-texts";
import { webEnv } from "./env";
import { runtime } from "./runtime";

const minute = 60;
const hour = 60 * minute;
const day = 24 * hour;
const limits = defaults.auth;
const loginWindow = {
  window: limits.rateLimit.login.windowMinutes * minute,
  max: limits.rateLimit.login.max,
};

/** Paths whose successful completion is written to the audit log (concept chapter 16). */
function auditAction(path: string, hadTwoFactorChallenge: boolean): AuthAuditAction | null {
  switch (path) {
    case "/sign-in/email":
      return "auth.sign_in";
    case "/magic-link/verify":
      return "auth.sign_in_magic_link";
    case "/verify-email":
      // autoSignInAfterVerification creates a session with the confirmation link.
      return "auth.sign_in_email_verification";
    case "/passkey/verify-authentication":
      return "auth.sign_in_passkey";
    case "/two-factor/verify-totp":
    case "/two-factor/verify-backup-code":
      return hadTwoFactorChallenge ? "auth.sign_in_two_factor" : "auth.two_factor_enabled";
    case "/change-password":
      return "auth.password_changed";
    default:
      return null;
  }
}

function createAuth() {
  const env = webEnv();
  const { core, mailer } = runtime();
  const redis = core.redis;
  const secure = env.WEB_URL.startsWith("https://");
  const origin = new URL(env.WEB_URL);
  const prefix = `${env.VALKEY_PREFIX}:auth:`;
  const appName = appTranslator("name");
  const requestIpHash = (headers: Headers | undefined) =>
    ipHash(
      core.deps.emailHashKey,
      headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers?.get("x-real-ip"),
    );

  return betterAuth({
    appName,
    baseURL: env.WEB_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [origin.origin],
    database: drizzleAdapter(core.deps.db, {
      provider: "pg",
      schema: { user, session, account, verification, twoFactor, passkey },
    }),
    // Rate limits and short-lived data live in Valkey; sessions stay in Postgres (E-025).
    secondaryStorage: {
      get: (key) => redis.get(prefix + key),
      set: async (key, value, ttl) => {
        if (ttl) await redis.set(prefix + key, value, "EX", ttl);
        else await redis.set(prefix + key, value);
      },
      getAndDelete: (key) => redis.getdel(prefix + key),
      increment: async (key, ttl) => {
        const value = await redis.incr(prefix + key);
        if (value === 1 && ttl) await redis.expire(prefix + key, ttl);
        return value;
      },
      delete: async (key) => {
        await redis.del(prefix + key);
      },
    },
    advanced: {
      // "uuid": PostgreSQL generates the ids via the uuidv7() column defaults.
      database: { generateId: "uuid" },
      cookiePrefix: "ep",
      useSecureCookies: secure,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure },
    },
    session: {
      expiresIn: limits.sessionDays * day,
      updateAge: limits.sessionRefreshHours * hour,
      freshAge: limits.freshLoginMinutes * minute,
      storeSessionInDatabase: true,
    },
    user: {
      additionalFields: {
        platformRole: { type: "string", required: false, defaultValue: "user", input: false },
      },
    },
    databaseHooks: {
      user: {
        // Display names end up in system mails (e.g. invitations): no control characters, limited length.
        create: {
          before: async (data) => ({ data: { ...data, name: sanitizeDisplayName(data.name) } }),
        },
        update: {
          before: async (data) =>
            typeof data.name === "string"
              ? { data: { ...data, name: sanitizeDisplayName(data.name) } }
              : { data },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: limits.passwordMinLength,
      maxPasswordLength: limits.passwordMaxLength,
      requireEmailVerification: true,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: limits.resetPasswordMinutes * minute,
      // A reset means the old password may be known to someone else: end every session.
      revokeSessionsOnPasswordReset: true,
      onPasswordReset: async ({ user: target }, request) => {
        const hash = requestIpHash(request?.headers);
        await recordAuthEvent(core.deps, {
          userId: target.id,
          action: "auth.password_reset",
          ...(hash ? { ipHash: hash } : {}),
        });
      },
      sendResetPassword: async ({ user: target, url }) => {
        await mailer.send({
          to: target.email,
          subject: emailTranslator("resetPassword.subject"),
          text: emailTranslator("resetPassword.text", {
            name: target.name,
            url,
            minutes: limits.resetPasswordMinutes,
          }),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: limits.verificationHours * hour,
      sendVerificationEmail: async ({ user: target, url }) => {
        await mailer.send({
          to: target.email,
          subject: emailTranslator("verify.subject"),
          text: emailTranslator("verify.text", {
            name: target.name,
            url,
            hours: limits.verificationHours,
          }),
        });
      },
    },
    rateLimit: {
      enabled: env.AUTH_RATE_LIMIT === "on",
      storage: "secondary-storage",
      window: limits.rateLimit.general.windowSeconds,
      max: limits.rateLimit.general.max,
      customRules: {
        "/sign-in/email": loginWindow,
        "/two-factor/verify-totp": loginWindow,
        "/two-factor/verify-backup-code": loginWindow,
        "/sign-in/magic-link": loginWindow,
        "/request-password-reset": {
          window: limits.rateLimit.passwordReset.windowMinutes * minute,
          max: limits.rateLimit.passwordReset.max,
        },
      },
    },
    hooks: {
      // Login limit per account in addition to the per-IP limit (concept chapter 16, E-024).
      before: createAuthMiddleware(async (ctx) => {
        if (env.AUTH_RATE_LIMIT !== "on") return;
        if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-in/magic-link") return;
        const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
        if (!email) return;
        const key = `${prefix}login-account:${emailHash(core.deps.emailHashKey, email)}`;
        const attempts = await redis.incr(key);
        if (attempts === 1) await redis.expire(key, loginWindow.window);
        if (attempts > loginWindow.max) {
          throw new APIError("TOO_MANY_REQUESTS", {
            code: "TOO_MANY_REQUESTS",
            message: "RATE_LIMITED",
          });
        }
      }),
      // Audit trail of sign-ins and 2FA changes (concept chapter 16).
      after: createAuthMiddleware(async (ctx) => {
        const headers = ctx.headers;
        const hash = requestIpHash(headers);
        const newSession = ctx.context.newSession;
        if (newSession) {
          const hadChallenge = /(?:^|;\s*)(?:__Secure-)?ep\.two_factor=/.test(
            headers?.get("cookie") ?? "",
          );
          const action = auditAction(ctx.path, hadChallenge);
          if (action)
            await recordAuthEvent(core.deps, {
              userId: newSession.user.id,
              action,
              ...(hash ? { ipHash: hash } : {}),
            });
          return;
        }
        if (
          ctx.path === "/two-factor/disable" &&
          ctx.context.session &&
          !(ctx.context.returned instanceof Error)
        ) {
          await recordAuthEvent(core.deps, {
            userId: ctx.context.session.user.id,
            action: "auth.two_factor_disabled",
            ...(hash ? { ipHash: hash } : {}),
          });
        }
      }),
    },
    plugins: [
      twoFactorPlugin({ issuer: appName }),
      magicLink({
        expiresIn: limits.magicLinkMinutes * minute,
        disableSignUp: true,
        sendMagicLink: async ({ email, url }) => {
          // Magic links do not pass the 2FA check of Better Auth. Accounts with 2FA therefore
          // get a hint to sign in with password and code instead of a link (ENTSCHEIDUNGEN E-018).
          if (await isTwoFactorEnabledForEmail(core.deps, email)) {
            await mailer.send({
              to: email,
              subject: emailTranslator("magicLinkTwoFactor.subject"),
              text: emailTranslator("magicLinkTwoFactor.text"),
            });
            return;
          }
          await mailer.send({
            to: email,
            subject: emailTranslator("magicLink.subject"),
            text: emailTranslator("magicLink.text", { url, minutes: limits.magicLinkMinutes }),
          });
        },
      }),
      passkeyPlugin({ rpID: origin.hostname, rpName: appName, origin: origin.origin }),
      ...(env.PASSWORD_BREACH_CHECK === "on" ? [haveIBeenPwned()] : []),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { __epAuth?: Auth };

export function auth(): Auth {
  globalForAuth.__epAuth ??= createAuth();
  return globalForAuth.__epAuth;
}
