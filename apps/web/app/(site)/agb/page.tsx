import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "../../../components/site/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.legalPages");
  return { title: t("terms.title") };
}

export default function TermsPage() {
  return <LegalPage pageKey="terms" />;
}
