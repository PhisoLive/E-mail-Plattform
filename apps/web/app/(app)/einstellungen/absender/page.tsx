import { can } from "@ep/core/permissions";
import { PageHeader } from "@ep/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SenderProfileForm } from "../../../../components/settings/sender-profile-form";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("senderProfile");
  return { title: t("title") };
}

export default async function SenderSettingsPage() {
  const t = await getTranslations("senderProfile");
  const { active } = await requireAppContext({ path: "/einstellungen/absender" });
  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} description={t("description")} />
      <SenderProfileForm canEdit={can(active.role, "settings.manage")} />
    </div>
  );
}
