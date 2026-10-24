import { Badge, Card, CardBody } from "@ep/ui";
import { CircleDashed } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Placeholder of a page whose feature comes in a later phase: says what will be here and offers
 * the next useful step – an honest empty state instead of a dead page (concept chapter 13).
 */
export function ComingSoon({
  icon,
  title,
  description,
  items,
  badge,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  items?: string[];
  badge: string;
  action?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardBody className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-start sm:gap-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong [&_svg]:size-5">
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
            <Badge tone="info">{badge}</Badge>
          </div>
          <p className="max-w-prose text-sm text-text-muted">{description}</p>
          {items && items.length > 0 ? (
            <ul className="grid gap-2 text-[13.5px] text-text sm:grid-cols-2">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CircleDashed
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-text-subtle"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </CardBody>
    </Card>
  );
}
