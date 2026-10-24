import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Security headers that do not depend on the request (concept chapter 16). The nonce-based
 * Content-Security-Policy is set per request in proxy.ts.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), browsing-topics=(), microphone=(self)",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const config: NextConfig = {
  // Separate build directory for E2E runs so they can run next to `pnpm dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  // Next would otherwise write an AGENTS.md into the app; rules for agents live in CLAUDE.md.
  agentRules: false,
  reactStrictMode: true,
  typedRoutes: false,
  serverExternalPackages: [
    "pino",
    "libsodium-wrappers",
    "postgres",
    "ioredis",
    "bullmq",
    "nodemailer",
  ],
  // Development request log without tokens in URLs (magic links, verification, invitations –
  // also inside an URL-encoded `next` parameter such as `?next=%2Feinladung%2F…`).
  logging: {
    incomingRequests: { ignore: [/\/api\/auth\//, /einladung/i, /token/i] },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withNextIntl(config);
