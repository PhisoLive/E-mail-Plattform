import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("ep-skeleton rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
}

/** Loading state: skeleton lines plus an invisible status text for screen readers. */
export function LoadingState({
  label,
  lines = 3,
  className,
}: {
  label: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, index) => `line-${index}`).map((key, index) => (
        <Skeleton key={key} className={cn("h-4", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Empty state: what is missing and the next step (concept chapter 13). */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-strong [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-[15px] font-semibold text-text">{title}</p>
        {description ? <p className="text-[13px] text-text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Error state with a solution (concept chapter 13). */
export function ErrorState({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-4 py-4",
        className,
      )}
    >
      <p className="text-[14px] font-semibold text-text">{title}</p>
      {description ? <p className="text-[13px] text-text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
