import type { ReactNode } from "react";
import { cn } from "./cn";

/** KPI tile: value with tabular figures, label and an optional explanation. */
export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 shadow-sm",
        className,
      )}
    >
      <p className="text-[13px] text-text-muted">{label}</p>
      <p className="tabular text-[22px] font-semibold tracking-tight text-text">{value}</p>
      {hint ? <p className="text-xs text-text-subtle">{hint}</p> : null}
    </div>
  );
}
