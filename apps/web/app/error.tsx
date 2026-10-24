"use client";

import { Button, buttonClasses } from "@ep/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("pages.error");
  return (
    <main
      id="inhalt"
      className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-start justify-center gap-4 px-4"
    >
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-text-muted">{t("text")}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={retry}>{t("retry")}</Button>
        <Link href="/start" className={buttonClasses({ variant: "secondary" })}>
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
