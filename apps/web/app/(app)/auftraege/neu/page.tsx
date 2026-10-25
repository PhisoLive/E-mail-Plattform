import { PageHeader } from "@ep/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NewCampaign } from "../../../../components/campaigns/new-campaign";
import { isTemplateKey } from "../../../../lib/templates";
import { requireAppContext } from "../../../../server/app-context";
import { activeCaller } from "../../../../server/workspace-caller";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("newCampaign");
  return { title: t("title") };
}

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ vorlage?: string | string[] }>;
}) {
  const { vorlage } = await searchParams;
  await requireAppContext({ path: "/auftraege/neu" });
  const workspace = await (await activeCaller()).workspace.current();
  const t = await getTranslations("newCampaign");
  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} description={t("description")} />
      <NewCampaign
        template={isTemplateKey(vorlage) ? vorlage : null}
        defaultFormality={workspace.defaultFormality}
      />
    </div>
  );
}
