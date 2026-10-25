/** Paths of the signed-in app – the proxy sends visitors without a session to the login. */
export const appPrefixes = [
  "/start",
  "/willkommen",
  "/chat",
  "/auftraege",
  "/posteingang",
  "/kontakte",
  "/vorlagen",
  "/postfaecher",
  "/agenten",
  "/einstellungen",
] as const;

/** Operator area (concept chapter 14, E-048) – hidden instead of protected. */
export const operatorPrefix = "/admin";

export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Pages that show the data of a workspace (app, onboarding, operator area). */
export function isWorkspacePage(pathname: string): boolean {
  return [...appPrefixes, operatorPrefix].some((prefix) => matchesPrefix(pathname, prefix));
}
