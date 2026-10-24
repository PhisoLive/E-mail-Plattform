"use client";

import { Tabs as RadixTabs } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn(
        "flex max-w-full gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "-mb-px shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-focus data-[state=active]:border-accent data-[state=active]:font-medium data-[state=active]:text-text",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn(
        "rounded-sm pt-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}
