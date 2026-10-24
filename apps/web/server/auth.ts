import "server-only";
import { passkey as passkeyPlugin } from "@better-auth/passkey";
import { defaults } from "@ep/config/defaults";
import { accountService, emailHash } from "@ep/core";
import { account, passkey, session, twoFactor, user, verification } from "@ep/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";
import { magicLink } from "better-auth/plugins/magic-link";
import { twoFactor as twoFactorPlugin } from "better-auth/plugins/two-factor";
import { emailTranslator } from "./email-texts";
import { webEnv } from "./env";
import { runtime } from "./runtime";

const minute = 60;
const day = 24 * 60 * minute;

function createAuth() {
  const env = webEnv();
  const { core, mailer } = runtime();
  const redis = core.redis;
  const secure = env.WEB_URL.startsWith("https://");
  const origin = new URL(env.WEB_URL);
  const prefix = `${env.VALKEY_PREFIX}:auth:`;

  return betterAuth({
    appName: "E-Mail-Plattform",
    baseURL: env.WEB_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [origin.origin],
    database: drizzleAdapter(core.deps.db, {
      provider: "pg",
      schema: { user, session, account, verification, twoFactor, passkey },
    }),
    // Rate limits and short-lived data live in Valkey, not in the database.
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
      expiresIn: defaults.auth.sessionDays * day,
      updateAge: day,
      freshAge: defaults.auth.freshLoginMinutes * minute,
      storeSessionInDatabase: true,
    },
    user: {
      additionalFields: {
        platformRole: { type: "string", required: false, defaultValue: "user", input: false },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: defaults.auth.passwordMinLength,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 60 * minute,
      sendResetPassword: async ({ user: target, url }) => {
        await mailer.send({
          to: target.email,
          subject: emailTranslator("resetPassword.subject"),
          text: emailTranslator("resetPassword.text", { name: target.name, url }),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: day,
      sendVerificationEmail: async ({ user: target, url }) => {
        await mailer.send({
          to: target.email,
          subject: emailTranslator("verify.subject"),
          text: emailTranslator("verify.text", { name: target.name, url }),
        });
      },
    },
    rateLimit: {
      enabled: env.AUTH_RATE_LIMIT === "on",
      storage: "secondary-storage",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": {
          window: defaults.auth.rateLimit.login.windowMinutes * minute,
          max: defaults.auth.rateLimit.login.max,
        },
        "/two-factor/verify-totp": {
          window: defaults.auth.rateLimit.login.windowMinutes * minute,
          max: defaults.auth.rateLimit.login.max,
        },
        "/sign-in/magic-link": {
          window: defaults.auth.rateLimit.login.windowMinutes * minute,
          max: defaults.auth.rateLimit.login.max,
        },
        "/request-password-reset": {
          window: defaults.auth.rateLimit.passwordReset.windowMinutes * minute,
          max: defaults.auth.rateLimit.passwordReset.max,
        },
      },
    },
    hooks: {
      // Login limit per account in addition to the per-IP limit (concept chapter 16).
      before: createAuthMiddleware(async (ctx) => {
        if (env.AUTH_RATE_LIMIT !== "on") return;
        if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-in/magic-link") return;
        const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
        if (!email) return;
        const key = `${prefix}login-account:${emailHash(core.deps.emailHashKey, email)}`;
        const attempts = await redis.incr(key);
        if (attempts === 1)
          await redis.expire(key, defaults.auth.rateLimit.login.windowMinutes * minute);
        if (attempts > defaults.auth.rateLimit.login.max) {
          throw new APIError("TOO_MANY_REQUESTS", { message: "RATE_LIMITED" });
        }
      }),
    },
    plugins: [
      twoFactorPlugin({ issuer: "E-Mail-Plattform" }),
      magicLink({
        expiresIn: 5 * minute,
        disableSignUp: true,
        sendMagicLink: async ({ email, url }) => {
          // Magic links do not pass the 2FA check of Better Auth. Accounts with 2FA therefore
          // get a hint to sign in with password and code instead of a link (ENTSCHEIDUNGEN E-018).
          if (await accountService.isTwoFactorEnabledForEmail(core.deps, email)) {
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
            text: emailTranslator("magicLink.text", { url }),
          });
        },
      }),
      passkeyPlugin({ rpID: origin.hostname, rpName: "E-Mail-Plattform", origin: origin.origin }),
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
