import type { ReactNode } from "react";
import { cn } from "./cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, string> = {
  info: "bg-accent-soft text-text border-accent/30",
  success: "bg-success-soft text-text border-success/30",
  warning: "bg-warning-soft text-text border-warning/40",
  danger: "bg-danger-soft text-text border-danger/30",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm", tones[tone], className)}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? (
        <div className={title ? "mt-1 text-text-muted" : undefined}>{children}</div>
      ) : null}
    </div>
  );
}
