"use client";

import { RadioGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

/** Small set of mutually exclusive options (e.g. light / dark / system). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  className?: string;
}) {
  return (
    <RadioGroup.Root
      aria-label={label}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      orientation="horizontal"
      className={cn("inline-flex rounded-md border border-border bg-surface-muted p-1", className)}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className="inline-flex h-8 items-center gap-2 rounded-[7px] px-3 text-[13px] text-text-muted transition-colors focus-visible:outline-2 focus-visible:outline-focus data-[state=checked]:bg-surface data-[state=checked]:font-medium data-[state=checked]:text-text data-[state=checked]:shadow-sm data-[state=checked]:ring-1 data-[state=checked]:ring-border-control [&_svg]:size-4"
        >
          {option.icon}
          {option.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
