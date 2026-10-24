import { FileUp, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaceholderPage, placeholderMetadata } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("contactLists");
}

export default async function ContactListsPage() {
  await requireAppContext({ path: "/kontakte/listen" });
  const t = await getTranslations("actions");
  return (
    <PlaceholderPage
      pageKey="contactLists"
      icon={<ListChecks aria-hidden="true" />}
      actions={[
        {
          href: "/kontakte/import",
          label: t("importContacts"),
          primary: true,
          icon: <FileUp aria-hidden="true" />,
        },
      ]}
    />
  );
}
