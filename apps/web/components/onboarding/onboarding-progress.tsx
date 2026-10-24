import { cn } from "@ep/ui";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

const all = ["workspace", "mailbox", "senderProfile", "agent", "campaign"] as const;

/** Step indicator of the onboarding. */
export async function OnboardingProgress({
  current,
  done,
}: {
  current: (typeof all)[number];
  done: Record<(typeof all)[number], boolean>;
}) {
  const t = await getTranslations("onboarding.flow");
  const index = all.indexOf(current);
  return (
    <nav aria-label={t("progressLabel")} className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-subtle">
        {t("stepOf", { step: index + 1, total: all.length })}
      </p>
      <ol className="grid grid-cols-5 gap-1.5">
        {all.map((step, position) => (
          <li key={step} aria-current={step === current ? "step" : undefined}>
            <span
              className={cn(
                "block h-1.5 rounded-full",
                done[step] ? "bg-accent" : position === index ? "bg-accent/50" : "bg-surface-muted",
              )}
            />
            <span className="mt-1.5 hidden items-center gap-1 text-[11px] text-text-muted sm:flex">
              {done[step] ? <Check aria-hidden="true" className="size-3 text-accent" /> : null}
              {t(`steps.${step}`)}
              <span className="sr-only">{done[step] ? `, ${t("done")}` : ""}</span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
