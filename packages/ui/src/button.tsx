"use client";

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { type ButtonSize, type ButtonVariant, buttonClasses } from "./button-classes";
import { cn } from "./cn";
import { useHydrated } from "./use-hydrated";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
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
  onClick,
  ...props
}: ButtonProps) {
  // Until its form is hydrated a submit button stays disabled: a native submit would reload the
  // page and lose the input (and a GET form would put it into the URL). No faded look meanwhile.
  const hydrated = useHydrated();
  const waiting = type === "submit" && !hydrated;
  return (
    <button
      type={type}
      className={buttonClasses({
        variant,
        size,
        className: cn(waiting && "disabled:opacity-100", className),
      })}
      // While loading the button stays focusable (a disabled one would drop the focus to
      // <body>); clicks and implicit form submission are ignored instead.
      disabled={disabled || waiting}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
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
