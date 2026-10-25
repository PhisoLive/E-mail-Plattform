import { buttonClasses, PageHeader } from "@ep/ui";
import { Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "../../../../components/coming-soon";
import { adminSectionBySlug } from "../../../../lib/admin";
import { requirePlatformAdmin } from "../../../../server/app-context";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  // The title must not reveal the area or its sections either (E-041).
  await requirePlatformAdmin();
  const section = adminSectionBySlug((await params).section);
  if (!section) notFound();
  const t = await getTranslations("admin");
  return { title: t(`sections.${section.key}.title`) };
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;
  await requirePlatformAdmin();
  const section = adminSectionBySlug(slug);
  if (!section) notFound();
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");
  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={t("title")}
        title={t(`sections.${section.key}.title`)}
        description={t(`sections.${section.key}.text`)}
        actions={
          <Link href="/admin" className={buttonClasses({ variant: "secondary" })}>
            {t("back")}
          </Link>
        }
      />
      <ComingSoon
        icon={<Shield aria-hidden="true" />}
        title={t("soonTitle")}
        description={t("soonText")}
        badge={tCommon("soon")}
      />
    </div>
  );
}
