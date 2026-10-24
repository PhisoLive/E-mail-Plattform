import { Bot, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlaceholderPage, placeholderMetadata } from "../../../components/placeholder-page";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("agents");
}

export default async function AgentsPage() {
  await requireAppContext({ path: "/agenten" });
  const t = await getTranslations("actions");
  return (
    <PlaceholderPage
      pageKey="agents"
      icon={<Bot aria-hidden="true" />}
      actions={[
        {
          href: "/agenten/neu",
          label: t("newAgent"),
          primary: true,
          icon: <Plus aria-hidden="true" />,
        },
      ]}
    />
  );
}
