import { buttonClasses, Card } from "@ep/ui";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const included = ["mailboxes", "mails", "ai", "agents", "team", "inboxTests"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pricing");
  return { title: t("title") };
}

/** Pricing (concept chapter 14): the model is set, the prices are not – no numbers yet. */
export default async function PricingPage() {
  const t = await getTranslations("site.pricing");
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-14 sm:px-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-text-muted">{t("intro")}</p>
      </div>
      <Card className="flex flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t("betaTitle")}</h2>
          <p className="text-sm text-text-muted">{t("betaText")}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-accent" />
              {t(`included.${item}`)}
            </li>
          ))}
        </ul>
        <div>
          <Link href="/registrieren" className={buttonClasses({ size: "lg" })}>
            {t("cta")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
