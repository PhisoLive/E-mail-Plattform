"use client";

import { DropdownMenu as RadixMenu } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export const DropdownMenu = RadixMenu.Root;
export const DropdownMenuTrigger = RadixMenu.Trigger;
export const DropdownMenuGroup = RadixMenu.Group;

export function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 6,
  ...props
}: ComponentProps<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "ep-animate-rise z-50 min-w-56 rounded-lg border border-border bg-surface p-1 shadow-lg",
          className,
        )}
        {...props}
      />
    </RadixMenu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  icon,
  children,
  ...props
}: ComponentProps<typeof RadixMenu.Item> & { icon?: ReactNode }) {
  return (
    <RadixMenu.Item
      className={cn(
        "flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-text outline-none select-none data-[highlighted]:bg-surface-hover data-[highlighted]:shadow-[inset_3px_0_0_var(--ep-accent)] data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-text-muted",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </RadixMenu.Item>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof RadixMenu.Label>) {
  return (
    <RadixMenu.Label
      className={cn("px-3 pt-2 pb-1 text-xs font-medium text-text-subtle", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof RadixMenu.Separator>) {
  return <RadixMenu.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}

export const DropdownMenuRadioGroup = RadixMenu.RadioGroup;

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof RadixMenu.RadioItem>) {
  return (
    <RadixMenu.RadioItem
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-md py-2 pr-3 pl-7 text-sm text-text outline-none select-none data-[highlighted]:bg-surface-hover data-[highlighted]:shadow-[inset_3px_0_0_var(--ep-accent)]",
        className,
      )}
      {...props}
    >
      <RadixMenu.ItemIndicator className="absolute left-3 inline-flex size-2 rounded-full bg-accent" />
      {children}
    </RadixMenu.RadioItem>
  );
}
