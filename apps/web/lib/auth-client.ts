"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { magicLinkClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [twoFactorClient(), magicLinkClient(), passkeyClient()],
});

/** Maps Better Auth error codes to keys in de.json. */
export function authErrorKey(code: string | undefined): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "auth.login.invalid";
    case "EMAIL_NOT_VERIFIED":
      return "auth.login.notVerified";
    case "PASSWORD_TOO_SHORT":
      return "auth.register.passwordTooShort";
    case "PASSWORD_COMPROMISED":
      return "auth.register.passwordPwned";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "auth.register.emailTaken";
    case "INVALID_CODE":
    case "INVALID_TWO_FACTOR_COOKIE":
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
      return "auth.twoFactor.invalid";
    case "TOO_MANY_REQUESTS":
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "errors.RATE_LIMITED";
    default:
      return "errors.INTERNAL";
  }
}

/** Only relative paths inside the app are allowed as redirect targets (no open redirect). */
export function safeNext(next: string | null | undefined, fallback = "/start"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  return next;
}
