/** Sections of the operator area (concept chapter 14). Texts: de.json `admin.sections.<key>`. */
export const adminSections = [
  { key: "workspaces", slug: "arbeitsbereiche" },
  { key: "users", slug: "nutzer" },
  { key: "trust", slug: "vertrauen" },
  { key: "mailboxPool", slug: "postfach-pool" },
  { key: "seedAccounts", slug: "pruefpostfaecher" },
  { key: "system", slug: "system" },
  { key: "suppressions", slug: "sperrliste" },
  { key: "announcements", slug: "ankuendigungen" },
] as const;

export type AdminSection = (typeof adminSections)[number];

export function adminSectionBySlug(slug: string): AdminSection | undefined {
  return adminSections.find((section) => section.slug === slug);
}
