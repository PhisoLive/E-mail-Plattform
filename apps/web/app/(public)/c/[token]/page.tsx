import { Card, CardBody } from "@ep/ui";
import { Link2Off } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clickRedirect");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Click redirect (concept chapter 13/15): only to stored target URLs, never an open redirect.
 * Links are stored from phase 4 on; until then every token is unknown.
 */
export default async function ClickRedirectPage() {
  const t = await getTranslations("clickRedirect");
  return (
    <Card className="w-full max-w-md">
      <CardBody className="flex flex-col gap-3 pt-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-muted text-text-muted">
          <Link2Off aria-hidden="true" className="size-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-text-muted">{t("text")}</p>
      </CardBody>
    </Card>
  );
}
