import { defaults } from "@ep/config/defaults";
import { PageHeader } from "@ep/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  AppearanceSettings,
  PasswordChange,
  ProfileDetails,
} from "../../../../components/settings/profile-forms";
import { TwoFactorSetup } from "../../../../components/two-factor-setup";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  const t = await getTranslations("profile");
  const tSettings = await getTranslations("settings.profile");
  const { session, needsTwoFactor } = await requireAppContext({
    path: "/einstellungen/profil",
    allowWithoutWorkspace: true,
    allowWithoutTwoFactor: true,
  });
  const twoFactor = <TwoFactorSetup enabled={session.twoFactorEnabled} required={needsTwoFactor} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={tSettings("title")} description={t("description")} />
      {needsTwoFactor ? twoFactor : null}
      <ProfileDetails
        name={session.name}
        email={session.email}
        maxNameLength={defaults.auth.nameMaxLength}
      />
      <AppearanceSettings />
      <PasswordChange
        minLength={defaults.auth.passwordMinLength}
        maxLength={defaults.auth.passwordMaxLength}
      />
      {needsTwoFactor ? null : twoFactor}
    </div>
  );
}
