import { Inbox, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaceholderPage, placeholderMetadata } from "../../../components/placeholder-page";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("inbox");
}

export default async function InboxPage() {
  await requireAppContext({ path: "/posteingang" });
  const t = await getTranslations("actions");
  return (
    <PlaceholderPage
      pageKey="inbox"
      icon={<Inbox aria-hidden="true" />}
      actions={[
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
