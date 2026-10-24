"use client";

import { Badge, Button, buttonClasses, Card, Dialog, DialogContent, DialogTrigger } from "@ep/ui";
import {
  CalendarClock,
  Eye,
  Handshake,
  HeartHandshake,
  type LucideIcon,
  Newspaper,
  PartyPopper,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type TemplateKey, templateKeys } from "../../lib/templates";

const icons: Record<TemplateKey, LucideIcon> = {
  summerParty: PartyPopper,
  appointmentReminder: CalendarClock,
  offerFollowUp: Handshake,
  newsletter: Newspaper,
  reviewRequest: Star,
  winBack: HeartHandshake,
};

/**
 * Template gallery with preview; "Verwenden" starts the assistant pre-filled (chapter 13).
 * Subjects and bodies contain literal placeholders like {vorname}, so they are read raw.
 */
export function TemplateGallery() {
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templateKeys.map((key) => {
        const Icon = icons[key];
        const name = t(`items.${key}.name`);
        return (
          <li key={key}>
            <Card className="flex h-full flex-col">
              <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                    <Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  <Badge>{t(`items.${key}.category`)}</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[15px] font-semibold tracking-tight">{name}</h2>
                  <p className="text-[13px] text-text-muted">{t(`items.${key}.description`)}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye aria-hidden="true" />}
                      aria-label={t("previewOf", { name })}
                    >
                      {t("preview")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    wide
                    title={name}
                    description={t(`items.${key}.description`)}
                    closeLabel={tCommon("close")}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="rounded-md border border-border bg-bg px-4 py-3">
                        <p className="text-xs text-text-subtle">{t("subject")}</p>
                        <p className="text-sm font-medium">
                          {String(t.raw(`items.${key}.subject`))}
                        </p>
                      </div>
                      <div className="whitespace-pre-line rounded-md border border-border bg-bg px-4 py-3 text-sm leading-relaxed">
                        {String(t.raw(`items.${key}.body`))}
                      </div>
                      <p className="text-xs text-text-muted">{String(t.raw("variablesHint"))}</p>
                      <div className="flex justify-end">
                        <Link href={`/auftraege/neu?vorlage=${key}`} className={buttonClasses()}>
                          {t("use")}
                        </Link>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Link
                  href={`/auftraege/neu?vorlage=${key}`}
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                  aria-label={t("useNamed", { name })}
                >
                  {t("use")}
                </Link>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
