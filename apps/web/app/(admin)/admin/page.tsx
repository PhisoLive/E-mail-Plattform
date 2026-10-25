import { Badge, Card, PageHeader } from "@ep/ui";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { adminSections } from "../../../lib/admin";
import { requirePlatformAdmin } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  // The title must not reveal the area either (E-041).
  await requirePlatformAdmin();
  const t = await getTranslations("admin");
  return { title: t("title") };
}

export default async function AdminPage() {
  await requirePlatformAdmin();
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");
  return (
    <div className="flex flex-col">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {adminSections.map((section) => (
          <li key={section.key}>
            <Card className="h-full transition-colors hover:border-border-strong">
              <Link
                href={`/admin/${section.slug}`}
                className="flex h-full flex-col gap-2 rounded-lg px-4 py-4 focus-visible:outline-2 focus-visible:outline-focus"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {t(`sections.${section.key}.title`)}
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 text-text-subtle" />
                </span>
                <span className="text-[13px] text-text-muted">
                  {t(`sections.${section.key}.text`)}
                </span>
                <Badge tone="info" className="mt-auto self-start">
                  {tCommon("soon")}
                </Badge>
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
