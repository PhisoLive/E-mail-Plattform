import { defaults } from "@ep/config/defaults";
import { can } from "@ep/core/permissions";
import { PageHeader } from "@ep/ui";
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
    <div className="flex flex-col">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <TeamSettings
        currentUserId={session.userId}
        actorRole={active.role}
        canManage={can(active.role, "team.manage")}
        invitationDays={defaults.invitation.expiresDays}
      />
    </div>
  );
}
