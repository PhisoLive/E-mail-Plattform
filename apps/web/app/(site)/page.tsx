import { buttonClasses, Card } from "@ep/ui";
import {
  BadgeCheck,
  Gauge,
  MailCheck,
  MapPin,
  MessageSquareText,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const steps = [
  { key: "goal", icon: MessageSquareText },
  { key: "agent", icon: Sparkles },
  { key: "approve", icon: ThumbsUp },
] as const;

const features = [
  { key: "ownAddress", icon: MailCheck },
  { key: "legal", icon: BadgeCheck },
  { key: "delivery", icon: Gauge },
  { key: "dach", icon: MapPin },
] as const;

export default async function HomePage() {
  const t = await getTranslations("site.home");
  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 pt-16 pb-14 sm:px-6 sm:pt-24">
        <p className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted shadow-sm">
          {t("badge")}
        </p>
        <h1 className="max-w-3xl text-[34px] leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-[17px] leading-relaxed text-text-muted">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/registrieren" className={buttonClasses({ size: "lg" })}>
            {t("cta")}
          </Link>
          <Link href="/preise" className={buttonClasses({ size: "lg", variant: "secondary" })}>
            {t("secondary")}
          </Link>
        </div>
      </section>

      <section aria-labelledby="how" className="border-y border-border bg-surface-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6">
          <h2 id="how" className="text-2xl font-semibold tracking-tight">
            {t("howTitle")}
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.key}>
                  <Card className="flex h-full flex-col gap-3 px-5 py-5">
                    <span className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                        <Icon aria-hidden="true" className="size-[18px]" />
                      </span>
                      <span className="tabular text-xs font-medium text-text-subtle">
                        {t("step", { number: index + 1 })}
                      </span>
                    </span>
                    <h3 className="text-[15px] font-semibold">{t(`steps.${step.key}.title`)}</h3>
                    <p className="text-sm text-text-muted">{t(`steps.${step.key}.text`)}</p>
                  </Card>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="features"
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6"
      >
        <h2 id="features" className="text-2xl font-semibold tracking-tight">
          {t("featuresTitle")}
        </h2>
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.key} className="flex gap-4">
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-[15px] font-semibold">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-text-muted">{t(`features.${feature.key}.text`)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
