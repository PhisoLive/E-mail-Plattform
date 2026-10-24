import { buttonClasses } from "@ep/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");
  return (
    <main
      id="inhalt"
      className="mx-auto flex min-h-dvh max-w-lg flex-col items-start justify-center gap-4 px-4"
    >
      <p className="tabular text-sm font-medium text-text-muted">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-text-muted">{t("text")}</p>
      <Link href="/" className={buttonClasses({ variant: "secondary" })}>
        {t("back")}
      </Link>
    </main>
  );
}
