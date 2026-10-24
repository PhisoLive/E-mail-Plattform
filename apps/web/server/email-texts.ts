import { defaults } from "@ep/config/defaults";
import { createTranslator } from "next-intl";
import messages from "../messages/de.json";

/** Texts of system mails – like all UI texts they live in messages/de.json, never in code. */
export const emailTranslator = createTranslator({ locale: "de", messages, namespace: "emails" });
export const roleTranslator = createTranslator({ locale: "de", messages, namespace: "roles" });
export const appTranslator = createTranslator({ locale: "de", messages, namespace: "app" });

export function formatDateDe(date: Date, timeZone = "Europe/Berlin"): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone }).format(date);
}

/** Display names appear in system mails: no control characters, no line breaks, limited length. */
export function sanitizeDisplayName(name: string): string {
  const cleaned = Array.from(name)
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < 32 || (code >= 127 && code < 160) || code === 0x2028 || code === 0x2029
        ? " "
        : char;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, defaults.auth.nameMaxLength);
}
