import { FileUp, ListChecks, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaceholderPage, placeholderMetadata } from "../../../components/placeholder-page";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("contacts");
}

export default async function ContactsPage() {
  await requireAppContext({ path: "/kontakte" });
  const t = await getTranslations("actions");
  return (
    <PlaceholderPage
      pageKey="contacts"
      icon={<Users aria-hidden="true" />}
      actions={[
        {
          href: "/kontakte/listen",
          label: t("lists"),
          icon: <ListChecks aria-hidden="true" />,
        },
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
