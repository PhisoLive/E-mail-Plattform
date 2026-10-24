import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "./cn";

const control =
  "w-full rounded-md border bg-surface text-sm text-text placeholder:text-text-subtle transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        control,
        "h-9 px-3",
        invalid ? "border-danger" : "border-border-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ className, invalid, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        control,
        "px-3 py-2 leading-relaxed",
        invalid ? "border-danger" : "border-border-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  ref?: Ref<HTMLSelectElement>;
}

/** Native select (keyboard and screen-reader friendly, works on every phone). */
export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        control,
        "h-9 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9 pl-3",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        invalid ? "border-danger" : "border-border-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 rounded-sm accent-[var(--ep-accent)]", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  // biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is passed by the caller.
  return <label className={cn("text-[13px] font-medium text-text", className)} {...props} />;
}

export interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Visually marks the field as required (the control itself needs `required`). */
  requiredMark?: string;
  children: ReactNode;
  className?: string;
}

/** Label, control, hint and error with correct aria wiring (ids `<id>-hint`, `<id>-error`). */
export function Field({ id, label, hint, error, requiredMark, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {requiredMark ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            {requiredMark}
          </span>
        ) : null}
      </Label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
