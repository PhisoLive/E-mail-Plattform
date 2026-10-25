"use client";

import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

/** Toasts for confirmations and undo ("Rückgängig statt Nachfragen", concept chapter 13). */
export function Toaster({
  closeLabel,
  label,
  theme,
}: {
  closeLabel: string;
  label: string;
  /** Same preference as the page ("system" follows the operating system like the tokens). */
  theme: "light" | "dark" | "system";
}) {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      theme={theme}
      containerAriaLabel={label}
      toastOptions={{
        closeButtonAriaLabel: closeLabel,
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-surface !text-text !shadow-lg",
          description: "!text-text-muted",
          closeButton: "!border-border !bg-surface !text-text-muted hover:!bg-surface-hover",
          actionButton: "!bg-accent !text-accent-text",
        },
      }}
    />
  );
}
