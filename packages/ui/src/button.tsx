import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-text hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface text-text border border-border-strong hover:bg-surface-hover shadow-sm",
  ghost: "text-text hover:bg-surface-hover",
  soft: "bg-accent-soft text-accent-strong hover:brightness-95",
  danger: "bg-danger text-on-danger hover:brightness-95 shadow-sm",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

/** Button look for other elements, e.g. a Next.js <Link> (no <button> inside <a>). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-[background-color,color,box-shadow,filter] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, ...(className ? { className } : {}) })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name – required because the button shows only an icon. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  const square = size === "sm" ? "size-8 px-0" : size === "lg" ? "size-11 px-0" : "size-9 px-0";
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={buttonClasses({ variant, size, className: cn(square, className) })}
      {...props}
    >
      {children}
    </button>
  );
}
