import { Plus, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("mailboxBuy");
}

export default async function MailboxBuyPage() {
  await requireAppContext({ path: "/postfaecher/kaufen" });
  const t = await getTranslations("actions");
  return (
    <PlaceholderPage
      pageKey="mailboxBuy"
      icon={<ShoppingBag aria-hidden="true" />}
      actions={[
        {
          href: "/postfaecher/verbinden",
          label: t("connectOwnMailbox"),
          icon: <Plus aria-hidden="true" />,
        },
      ]}
    />
  );
}
