import { PageHeader } from "@ep/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AgentTemplatePicker } from "../../../../components/agents/agent-template-picker";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("newAgent");
  return { title: t("title") };
}

export default async function NewAgentPage() {
  await requireAppContext({ path: "/agenten/neu" });
  const t = await getTranslations("newAgent");
  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} description={t("description")} />
      <AgentTemplatePicker />
    </div>
  );
}
