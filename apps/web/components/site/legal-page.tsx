import { Alert } from "@ep/ui";
import { getTranslations } from "next-intl/server";

/** Legal page of the website. The final texts come with the review by a law firm (chapter 17). */
export async function LegalPage({ pageKey }: { pageKey: "imprint" | "privacy" | "terms" | "dpa" }) {
  const t = await getTranslations("site.legalPages");
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t(`${pageKey}.title`)}</h1>
      <p className="text-[15px] leading-relaxed text-text-muted">{t(`${pageKey}.intro`)}</p>
      <Alert tone="info">{t("pending")}</Alert>
    </article>
  );
}
