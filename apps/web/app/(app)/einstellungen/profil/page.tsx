import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TwoFactorSetup } from "../../../../components/two-factor-setup";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  const t = await getTranslations("settings.profile");
  const { session, needsTwoFactor } = await requireAppContext({
    path: "/einstellungen/profil",
    allowWithoutWorkspace: true,
    allowWithoutTwoFactor: true,
  });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-text-muted">
          {session.name} · {session.email}
        </p>
      </div>
      <TwoFactorSetup enabled={session.twoFactorEnabled} required={needsTwoFactor} />
    </div>
  );
}
