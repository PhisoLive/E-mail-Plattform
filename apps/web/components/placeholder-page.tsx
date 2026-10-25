import { defaults } from "@ep/config/defaults";
import { buttonClasses, EmptyState, PageHeader } from "@ep/ui";
import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ComingSoon } from "./coming-soon";

export type PlaceholderKey =
  | "inbox"
  | "inboxMailbox"
  | "inboxThread"
  | "campaigns"
  | "contacts"
  | "contactDetail"
  | "contactLists"
  | "contactImport"
  | "mailboxes"
  | "mailboxDetail"
  | "mailboxBuy"
  | "agents"
  | "agentDetail"
  | "chat"
  | "plan"
  | "privacy"
  | "notifications"
  | "connections"
  | "api";

type ActionKey =
  | "connectMailbox"
  | "connectOwnMailbox"
  | "newCampaign"
  | "importContacts"
  | "newAgent"
  | "backToInbox"
  | "backToContacts"
  | "backToAgents"
  | "backToMailboxes"
  | "viewPrices"
  | "readPrivacy"
  | "toProfile"
  | "toStart";

/** The next useful step of every placeholder page (concept chapter 13: empty state with next step). */
const nextSteps: Record<PlaceholderKey, { href: string; label: ActionKey }> = {
  inbox: { href: "/postfaecher/verbinden", label: "connectMailbox" },
  inboxMailbox: { href: "/posteingang", label: "backToInbox" },
  inboxThread: { href: "/posteingang", label: "backToInbox" },
  campaigns: { href: "/auftraege/neu", label: "newCampaign" },
  contacts: { href: "/kontakte/import", label: "importContacts" },
  contactDetail: { href: "/kontakte", label: "backToContacts" },
  contactLists: { href: "/kontakte/import", label: "importContacts" },
  contactImport: { href: "/kontakte", label: "backToContacts" },
  mailboxes: { href: "/postfaecher/verbinden", label: "connectMailbox" },
  mailboxDetail: { href: "/postfaecher", label: "backToMailboxes" },
  mailboxBuy: { href: "/postfaecher/verbinden", label: "connectOwnMailbox" },
  agents: { href: "/agenten/neu", label: "newAgent" },
  agentDetail: { href: "/agenten", label: "backToAgents" },
  chat: { href: "/agenten", label: "backToAgents" },
  plan: { href: "/preise", label: "viewPrices" },
  privacy: { href: "/datenschutz", label: "readPrivacy" },
  notifications: { href: "/einstellungen/profil", label: "toProfile" },
  connections: { href: "/postfaecher/verbinden", label: "connectMailbox" },
  api: { href: "/start", label: "toStart" },
};

export interface PageAction {
  href: string;
  label: string;
  primary?: boolean;
  icon?: ReactNode;
}

export async function placeholderMetadata(key: PlaceholderKey): Promise<Metadata> {
  const t = await getTranslations(`placeholders.${key}`);
  return { title: t("title") };
}

export function ActionLinks({ actions }: { actions: PageAction[] }) {
  return (
    <>
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={buttonClasses({ variant: action.primary ? "primary" : "secondary" })}
        >
          {action.icon}
          {action.label}
        </Link>
      ))}
    </>
  );
}

/** Page of a later phase: header, what will be here, and the next useful step. */
export async function PlaceholderPage({
  pageKey,
  icon,
  actions = [],
  title,
  eyebrow,
  aside,
  children,
}: {
  pageKey: PlaceholderKey;
  icon: ReactNode;
  actions?: PageAction[];
  /** Overrides the title, e.g. with the name of the object. */
  title?: string;
  eyebrow?: string;
  /** Optional detail column on the right (contact, thread, events – concept chapter 13). */
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const t = await getTranslations(`placeholders.${pageKey}`);
  const tCommon = await getTranslations("common");
  const tActions = await getTranslations("actions");
  const next = nextSteps[pageKey];
  return (
    <div className="flex flex-col">
      <PageHeader
        title={title ?? t("title")}
        description={t("description")}
        {...(eyebrow ? { eyebrow } : {})}
        {...(actions.length > 0 ? { actions: <ActionLinks actions={actions} /> } : {})}
      />
      <div className={aside ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]" : undefined}>
        <div className="flex min-w-0 flex-col gap-6">
          {children}
          <ComingSoon
            icon={icon}
            title={t("soonTitle")}
            description={t("soonText", { minutes: defaults.notify.emailBundleMinutes })}
            items={t.raw("items") as string[]}
            badge={tCommon("soon")}
            action={
              <Link
                href={next.href}
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                {tActions(next.label)}
              </Link>
            }
          />
        </div>
        {aside ? <aside aria-label={t("asideLabel")}>{aside}</aside> : null}
      </div>
    </div>
  );
}

/** Object not found or not in this workspace – same answer, so nothing leaks (concept chapter 16). */
export async function NotFoundState({
  backHref,
  backLabel,
}: {
  backHref: string;
  backLabel: string;
}) {
  const t = await getTranslations("pages.objectNotFound");
  return (
    <EmptyState
      icon={<SearchX aria-hidden="true" />}
      title={t("title")}
      description={t("text")}
      action={
        <Link href={backHref} className={buttonClasses({ variant: "secondary" })}>
          {backLabel}
        </Link>
      }
    />
  );
}
