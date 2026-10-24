import pino, { type Logger } from "pino";

/**
 * Application logger. No passwords, tokens or mail contents in logs; e-mail addresses only as
 * hash (concept chapter 16). Redaction is the safety net – code must not log such fields at all.
 */
export const redactedPaths = [
  "password",
  "*.password",
  "token",
  "*.token",
  "secret",
  "*.secret",
  "authorization",
  "*.authorization",
  "headers.authorization",
  "headers.cookie",
  "cookie",
  "*.cookie",
  "ciphertext",
  "*.ciphertext",
  "sealed",
  "*.sealed",
  "accessToken",
  "*.accessToken",
  "refreshToken",
  "*.refreshToken",
  "body",
  "*.body",
  "html",
  "*.html",
  "text",
  "*.text",
  "email",
  "*.email",
];

export function createLogger(service: string, level = "info"): Logger {
  return pino({
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: redactedPaths, censor: "[redacted]" },
  });
}

export type { Logger };
