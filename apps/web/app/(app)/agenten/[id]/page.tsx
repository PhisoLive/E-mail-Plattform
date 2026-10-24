import { Bot } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  NotFoundState,
  PlaceholderPage,
  placeholderMetadata,
} from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";
import { lookup } from "../../../../server/lookup";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("agentDetail");
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAppContext({ path: `/agenten/${id}` });
  const t = await getTranslations("actions");
  const object = await lookup("agent", id);
  if (!object) return <NotFoundState backHref="/agenten" backLabel={t("backToAgents")} />;
  return (
    <PlaceholderPage
      pageKey="agentDetail"
      icon={<Bot aria-hidden="true" />}
      title={object.title || t("untitled")}
      actions={[{ href: "/agenten", label: t("backToAgents") }]}
    />
  );
}
