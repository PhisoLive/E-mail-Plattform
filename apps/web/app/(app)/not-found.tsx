import { buttonClasses, EmptyState } from "@ep/ui";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AppNotFound() {
  const t = await getTranslations("pages.notFound");
  return (
    <EmptyState
      icon={<SearchX aria-hidden="true" />}
      title={t("title")}
      description={t("text")}
      action={
        <Link href="/start" className={buttonClasses({ variant: "secondary" })}>
          {t("back")}
        </Link>
      }
    />
  );
}
