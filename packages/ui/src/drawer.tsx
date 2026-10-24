"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "./cn";

export const Drawer = RadixDialog.Root;
export const DrawerTrigger = RadixDialog.Trigger;
export const DrawerClose = RadixDialog.Close;

/** Panel sliding in from the left (mobile navigation) – a modal dialog with focus trap. */
export function DrawerContent({
  title,
  closeLabel,
  children,
  className,
}: {
  title: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="ep-animate-fade fixed inset-0 z-50 bg-overlay" />
      <RadixDialog.Content
        aria-describedby={undefined}
        className={cn(
          "ep-animate-slide fixed inset-y-0 left-0 z-50 flex w-[min(300px,86vw)] flex-col border-r border-border bg-sidebar shadow-lg",
          className,
        )}
      >
        <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
        <RadixDialog.Close
          aria-label={closeLabel}
          title={closeLabel}
          className="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-md text-text-subtle hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
        >
          <X aria-hidden="true" className="size-4" />
        </RadixDialog.Close>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
