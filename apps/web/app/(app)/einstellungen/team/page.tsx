import { can } from "@ep/core";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TeamSettings } from "../../../../components/team-settings";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.team");
  return { title: t("title") };
}

export default async function TeamPage() {
  const t = await getTranslations("settings.team");
  const { session, active } = await requireAppContext({ path: "/einstellungen/team" });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-text-muted">{t("subtitle")}</p>
      </div>
      <TeamSettings
        currentUserId={session?.userId ?? ""}
        canManage={active ? can(active.role, "team.manage") : false}
      />
    </div>
  );
}
