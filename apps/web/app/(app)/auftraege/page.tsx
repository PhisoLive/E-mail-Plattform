import { LayoutTemplate, Plus, Send } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaceholderPage, placeholderMetadata } from "../../../components/placeholder-page";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("campaigns");
}

export default async function CampaignsPage() {
  await requireAppContext({ path: "/auftraege" });
  const t = await getTranslations("actions");
  return (
    <PlaceholderPage
      pageKey="campaigns"
      icon={<Send aria-hidden="true" />}
      actions={[
        {
          href: "/vorlagen",
          label: t("templates"),
          icon: <LayoutTemplate aria-hidden="true" />,
        },
        {
          href: "/auftraege/neu",
          label: t("newCampaign"),
          primary: true,
          icon: <Plus aria-hidden="true" />,
        },
      ]}
    />
  );
}
