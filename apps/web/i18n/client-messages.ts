import type { AbstractIntlMessages } from "next-intl";

/**
 * Namespaces that client components read. Only these reach the browser: server-only texts
 * (operator area, system mails, website, placeholders) stay on the server (E-041).
 */
export const clientNamespaces = [
  "app",
  "common",
  "auth",
  "onboarding",
  "settings",
  "roles",
  "errors",
  "pages",
  "nav",
  "settingsNav",
  "shell",
  "profile",
  "senderProfile",
  "imprint",
  "templates",
  "newCampaign",
  "connectMailbox",
  "newAgent",
  "publicPages",
] as const;

export function pickClientMessages(messages: Record<string, unknown>): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const namespace of clientNamespaces) {
    const value = messages[namespace] as AbstractIntlMessages | string | undefined;
    if (value !== undefined) picked[namespace] = value;
  }
  return picked;
}
