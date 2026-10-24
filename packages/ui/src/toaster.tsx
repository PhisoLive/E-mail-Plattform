"use client";

import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

/** Toasts for confirmations and undo ("Rückgängig statt Nachfragen", concept chapter 13). */
export function Toaster({ closeLabel }: { closeLabel: string }) {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        closeButtonAriaLabel: closeLabel,
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-surface !text-text !shadow-lg",
          description: "!text-text-muted",
          actionButton: "!bg-accent !text-accent-text",
        },
      }}
    />
  );
}
