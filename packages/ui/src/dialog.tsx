"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "./cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
  title,
  description,
  closeLabel,
  children,
  className,
  wide = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="ep-animate-fade fixed inset-0 z-50 bg-overlay" />
      <RadixDialog.Content
        className={cn(
          "ep-animate-rise fixed top-1/2 left-1/2 z-50 flex max-h-[min(90dvh,720px)] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg",
          wide ? "max-w-2xl" : "max-w-md",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="flex flex-col gap-1">
            <RadixDialog.Title className="text-base font-semibold tracking-tight">
              {title}
            </RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="text-[13px] text-text-muted">
                {description}
              </RadixDialog.Description>
            ) : null}
          </div>
          <RadixDialog.Close
            aria-label={closeLabel}
            className="-mt-1 -mr-1 inline-flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
          >
            <X className="size-4" aria-hidden="true" />
          </RadixDialog.Close>
        </div>
        <div className="overflow-y-auto px-5 pt-4 pb-5">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
