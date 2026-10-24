/** Template gallery (concept chapter 13). Texts: de.json `templates.items.<key>`. */
export const templateKeys = [
  "summerParty",
  "appointmentReminder",
  "offerFollowUp",
  "newsletter",
  "reviewRequest",
  "winBack",
] as const;
export type TemplateKey = (typeof templateKeys)[number];

export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === "string" && (templateKeys as readonly string[]).includes(value);
}
