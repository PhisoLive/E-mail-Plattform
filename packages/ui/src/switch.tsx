"use client";

import { Switch as RadixSwitch } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Switch({ className, ...props }: ComponentProps<typeof RadixSwitch.Root>) {
  return (
    <RadixSwitch.Root
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-border-strong transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[state=checked]:bg-accent disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
    </RadixSwitch.Root>
  );
}
