import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-surface shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  headingLevel = 2,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <span className="mt-0.5 text-text-muted [&_svg]:size-[18px]">{icon}</span> : null}
        <div className="flex min-w-0 flex-col gap-0.5">
          <Heading className="text-[15px] font-semibold tracking-tight text-text">{title}</Heading>
          {description ? <p className="text-[13px] text-text-muted">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border bg-surface-muted/50 px-5 py-3 rounded-b-lg",
        className,
      )}
      {...props}
    />
  );
}
