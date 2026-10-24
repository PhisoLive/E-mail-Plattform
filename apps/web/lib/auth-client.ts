"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { magicLinkClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [twoFactorClient(), magicLinkClient(), passkeyClient()],
});

/** Maps Better Auth error codes (and HTTP status) to keys in de.json. */
export function authErrorKey(code: string | undefined, status?: number): string {
  if (status === 429) return "errors.RATE_LIMITED";
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "auth.login.invalid";
    case "EMAIL_NOT_VERIFIED":
      return "auth.login.notVerified";
    case "INVALID_EMAIL":
      return "auth.errors.invalidEmail";
    case "INVALID_PASSWORD":
      return "auth.errors.wrongPassword";
    case "PASSWORD_TOO_SHORT":
      return "auth.register.passwordTooShort";
    case "PASSWORD_TOO_LONG":
      return "auth.errors.passwordTooLong";
    case "PASSWORD_COMPROMISED":
      return "auth.register.passwordPwned";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "auth.register.emailTaken";
    case "INVALID_CODE":
    case "INVALID_TWO_FACTOR_COOKIE":
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
      return "auth.twoFactor.invalid";
    case "SESSION_EXPIRED":
      return "errors.FRESH_LOGIN_REQUIRED";
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return "auth.errors.linkExpired";
    case "TOO_MANY_REQUESTS":
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "errors.RATE_LIMITED";
    default:
      return "errors.INTERNAL";
  }
}

export { safeNext } from "./safe-next";
