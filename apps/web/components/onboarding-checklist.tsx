import type { OnboardingStatus } from "@ep/core/services/onboarding";
import { buttonClasses, Card, CardBody, CardHeader, cn } from "@ep/ui";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const steps = [
  { key: "workspace", href: "/einstellungen/team" },
  { key: "mailbox", href: "/willkommen?schritt=postfach" },
  { key: "senderProfile", href: "/willkommen?schritt=absender" },
  { key: "agent", href: "/willkommen?schritt=agent" },
  { key: "campaign", href: "/willkommen?schritt=auftrag" },
] as const;

/** Setup checklist of the start page – each step with its direct action (concept chapter 13). */
export async function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const t = await getTranslations("onboardingChecklist");
  const percent = Math.round((status.done / status.total) * 100);
  const next = steps.find((step) => !status.steps[step.key]);
  return (
    <Card>
      <CardHeader
        icon={<Sparkles aria-hidden="true" />}
        title={t("title")}
        description={t("progress", { done: status.done, total: status.total })}
        action={
          next ? (
            <Link href={next.href} className={buttonClasses({ size: "sm" })}>
              {t("continue")}
            </Link>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-4">
        <div
          role="progressbar"
          aria-label={t("title")}
          aria-valuemin={0}
          aria-valuemax={status.total}
          aria-valuenow={status.done}
          aria-valuetext={t("progress", { done: status.done, total: status.total })}
          className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => {
            const done = status.steps[step.key];
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className={cn(
                    "flex h-full items-start gap-3 rounded-md border px-3 py-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-focus",
                    done
                      ? "border-transparent bg-surface-muted text-text-muted"
                      : "border-border hover:border-border-strong hover:bg-surface-hover",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      done ? "bg-success text-bg" : "border border-border-strong text-text-muted",
                    )}
                  >
                    {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="flex flex-col">
                    <span
                      className={cn(
                        "font-medium",
                        done ? "line-through decoration-text-subtle" : "text-text",
                      )}
                    >
                      {t(`steps.${step.key}`)}
                    </span>
                    <span className="sr-only">{done ? t("done") : t("open")}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}
