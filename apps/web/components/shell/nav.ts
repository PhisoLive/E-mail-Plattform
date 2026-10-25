import {
  Bot,
  House,
  Inbox,
  LayoutTemplate,
  type LucideIcon,
  Mailbox,
  Send,
  Settings,
  Shield,
  Users,
} from "lucide-react";

/** A link of the sidebar. */
export interface NavLinkItem {
  key: string;
  href: string;
  icon: LucideIcon;
}

/** Main navigation of the app shell (concept chapter 13). Texts: de.json `nav.<key>`. */
export interface NavItem extends NavLinkItem {
  key:
    | "start"
    | "inbox"
    | "campaigns"
    | "contacts"
    | "templates"
    | "mailboxes"
    | "agents"
    | "settings";
}

export const mainNav: NavItem[] = [
  { key: "start", href: "/start", icon: House },
  { key: "inbox", href: "/posteingang", icon: Inbox },
  { key: "campaigns", href: "/auftraege", icon: Send },
  { key: "contacts", href: "/kontakte", icon: Users },
  { key: "templates", href: "/vorlagen", icon: LayoutTemplate },
  { key: "mailboxes", href: "/postfaecher", icon: Mailbox },
];

export const agentsNav: NavItem = { key: "agents", href: "/agenten", icon: Bot };

export const settingsLink: NavItem = {
  key: "settings",
  href: "/einstellungen/profil",
  icon: Settings,
};

/** Operator area – its label comes from the server and only for platform admins (E-041). */
export const adminNav = { key: "admin", href: "/admin", icon: Shield } as const;

/** Settings sections (concept chapter 13: Profil, Team, Absender, Abmeldeseite, Tarif, Datenschutz, Benachrichtigungen, Verbindungen, API). */
export const settingsNav = [
  { key: "profile", href: "/einstellungen/profil" },
  { key: "team", href: "/einstellungen/team" },
  { key: "sender", href: "/einstellungen/absender" },
  { key: "unsubscribePage", href: "/einstellungen/abmeldeseite" },
  { key: "plan", href: "/einstellungen/tarif" },
  { key: "privacy", href: "/einstellungen/datenschutz" },
  { key: "notifications", href: "/einstellungen/benachrichtigungen" },
  { key: "connections", href: "/einstellungen/verbindungen" },
  { key: "api", href: "/einstellungen/api" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  if (href === "/start") return pathname === "/start";
  if (href.startsWith("/einstellungen")) return pathname.startsWith("/einstellungen");
  return pathname === href || pathname.startsWith(`${href}/`);
}
