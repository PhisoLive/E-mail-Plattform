import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "../../../components/site/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.legalPages");
  return { title: t("privacy.title") };
}

export default function PrivacyPage() {
  return <LegalPage pageKey="privacy" />;
}
