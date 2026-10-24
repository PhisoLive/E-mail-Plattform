"use client";

import { Button, buttonClasses, ErrorState } from "@ep/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Error state inside the app shell – navigation stays usable (concept chapter 13). */
export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("pages.error");
  return (
    <ErrorState
      title={t("title")}
      description={t("text")}
      action={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={retry}>
            {t("retry")}
          </Button>
          <Link href="/start" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            {t("home")}
          </Link>
        </div>
      }
    />
  );
}
