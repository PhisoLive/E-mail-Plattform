import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DetailTabs } from "../../../../components/detail-tabs";
import { NotFoundState } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";
import { lookup } from "../../../../server/lookup";

const tabs = ["overview", "live", "recipients", "messages", "replies", "result", "report"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("campaignDetail");
  return { title: t("title") };
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAppContext({ path: `/auftraege/${id}` });
  const t = await getTranslations("campaignDetail");
  const tActions = await getTranslations("actions");
  const tStatus = await getTranslations("status.campaign");
  const tCommon = await getTranslations("common");
  const campaign = await lookup("campaign", id);
  if (!campaign)
    return <NotFoundState backHref="/auftraege" backLabel={tActions("backToCampaigns")} />;
  return (
    <DetailTabs
      eyebrow={t("title")}
      title={campaign.title}
      status={campaign.status ? tStatus(campaign.status as never) : undefined}
      description={t("description")}
      actions={[{ href: "/auftraege", label: tActions("backToCampaigns") }]}
      label={t("tabsLabel")}
      soon={tCommon("soon")}
      tabs={tabs.map((tab) => ({
        value: tab,
        label: t(`tabs.${tab}`),
        title: t(`empty.${tab}.title`),
        text: t(`empty.${tab}.text`),
      }))}
    />
  );
}
