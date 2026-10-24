import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UnsubscribeCard } from "../../../../components/public/unsubscribe-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("unsubscribe");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Public unsubscribe page (concept chapter 13). Tokens are resolved from phase 4 on (edge
 * service); until then every link is unknown and the page explains the fallback.
 */
export default async function UnsubscribePage() {
  const t = await getTranslations("unsubscribe");
  return (
    <UnsubscribeCard
      disabled
      senderLines={[]}
      texts={{
        title: t("title"),
        text: t("invalid"),
        confirm: t("confirm"),
        senderLabel: t("sender"),
      }}
      footer={<p className="text-xs text-text-muted">{t("fallback")}</p>}
    />
  );
}
