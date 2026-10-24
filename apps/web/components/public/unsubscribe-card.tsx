import { Button, Card, CardBody } from "@ep/ui";
import { MailX } from "lucide-react";
import type { ReactNode } from "react";

export interface UnsubscribeTexts {
  title: string;
  text: string;
  confirm: string;
  senderLabel: string;
}

/**
 * Layout of the public unsubscribe page (concept chapter 13): who sends, what happens, one button.
 * Used for the real page and for the preview in the settings.
 */
export function UnsubscribeCard({
  texts,
  senderLines,
  disabled = false,
  footer,
}: {
  texts: UnsubscribeTexts;
  senderLines: string[];
  disabled?: boolean;
  footer?: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardBody className="flex flex-col gap-5 pt-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <MailX aria-hidden="true" className="size-5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{texts.title}</h1>
          <p className="text-sm text-text-muted">{texts.text}</p>
        </div>
        <Button size="lg" disabled={disabled} className="w-full">
          {texts.confirm}
        </Button>
        {senderLines.length > 0 ? (
          <div className="border-t border-border pt-4 text-xs leading-relaxed text-text-muted">
            <p className="mb-1 font-medium text-text">{texts.senderLabel}</p>
            {senderLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
        {footer}
      </CardBody>
    </Card>
  );
}
