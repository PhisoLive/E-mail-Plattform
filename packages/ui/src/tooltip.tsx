"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactNode } from "react";

export const TooltipProvider = RadixTooltip.Provider;

/** Tooltip for additional explanations – never the only place of essential information. */
export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <RadixTooltip.Root delayDuration={250}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="ep-animate-fade z-50 max-w-64 rounded-md bg-text px-2.5 py-1.5 text-xs leading-snug text-bg shadow-md"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
