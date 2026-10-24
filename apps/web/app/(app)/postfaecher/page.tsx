import { Mailbox, Plus, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaceholderPage, placeholderMetadata } from "../../../components/placeholder-page";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("mailboxes");
}

export default async function MailboxesPage() {
  await requireAppContext({ path: "/postfaecher" });
  const t = await getTranslations("actions");
  return (
    <PlaceholderPage
      pageKey="mailboxes"
      icon={<Mailbox aria-hidden="true" />}
      actions={[
        {
          href: "/postfaecher/kaufen",
          label: t("buyMailbox"),
          icon: <ShoppingBag aria-hidden="true" />,
        },
        {
          href: "/postfaecher/verbinden",
          label: t("connectMailbox"),
          primary: true,
          icon: <Plus aria-hidden="true" />,
        },
      ]}
    />
  );
}
