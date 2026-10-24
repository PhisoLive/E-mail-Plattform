import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreateWorkspaceForm } from "../../../components/create-workspace-form";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding.createWorkspace");
  return { title: t("title") };
}

export default async function WelcomePage() {
  await requireAppContext({
    path: "/willkommen",
    allowWithoutWorkspace: true,
    allowWithoutTwoFactor: true,
  });
  return <CreateWorkspaceForm />;
}
