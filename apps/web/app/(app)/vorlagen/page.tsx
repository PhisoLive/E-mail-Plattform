import { PageHeader } from "@ep/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TemplateGallery } from "../../../components/templates/template-gallery";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("templates");
  return { title: t("title") };
}

export default async function TemplatesPage() {
  await requireAppContext({ path: "/vorlagen" });
  const t = await getTranslations("templates");
  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} description={t("description")} />
      <TemplateGallery />
    </div>
  );
}
