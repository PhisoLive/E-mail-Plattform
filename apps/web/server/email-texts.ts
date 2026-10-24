import { createTranslator } from "next-intl";
import messages from "../messages/de.json";

/** Texts of system mails – like all UI texts they live in messages/de.json, never in code. */
export const emailTranslator = createTranslator({ locale: "de", messages, namespace: "emails" });
export const roleTranslator = createTranslator({ locale: "de", messages, namespace: "roles" });

export function formatDateDe(date: Date, timeZone = "Europe/Berlin"): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone }).format(date);
}
