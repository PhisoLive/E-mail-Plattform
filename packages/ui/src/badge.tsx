import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-text-muted border-border",
  accent: "bg-accent-soft text-accent-strong border-transparent",
  success: "bg-success-soft text-text border-transparent",
  warning: "bg-warning-soft text-text border-transparent",
  danger: "bg-danger-soft text-text border-transparent",
  info: "bg-info-soft text-text border-transparent",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const dots: Record<"green" | "yellow" | "red" | "grey", string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-danger",
  grey: "bg-text-subtle",
};

/** Traffic light ("Ampel") with a visible or screen-reader label – colour is never the only signal. */
export function StatusDot({
  status,
  label,
  showLabel = true,
}: {
  status: keyof typeof dots;
  label: string;
  showLabel?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-text">
      <span aria-hidden="true" className={cn("inline-block size-2 rounded-full", dots[status])} />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border-strong bg-surface px-1 font-sans text-[11px] text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
