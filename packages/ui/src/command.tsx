"use client";

import { Command as Cmdk } from "cmdk";
import { Search } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { useFocusReturn } from "./focus-return";

/**
 * Command palette (Ctrl+K / ⌘K, concept chapter 13): search, jump, run actions.
 * Built on cmdk (combobox + listbox semantics) inside a Radix dialog (focus trap, Esc).
 */
export function CommandDialog({
  open,
  onOpenChange,
  title,
  placeholder,
  emptyText,
  returnFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  placeholder: string;
  emptyText: string;
  /** Where the focus goes after closing if the element it came from is gone. */
  returnFocus?: () => HTMLElement | null;
  children: ReactNode;
}) {
  const focusReturn = useFocusReturn(returnFocus);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ep-animate-fade fixed inset-0 z-50 bg-overlay" />
        <RadixDialog.Content
          {...focusReturn}
          aria-describedby={undefined}
          className="ep-animate-rise fixed top-[10dvh] left-1/2 z-50 w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
          <Cmdk label={title} loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search aria-hidden="true" className="size-4 shrink-0 text-text-subtle" />
              <Cmdk.Input
                placeholder={placeholder}
                className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-text-subtle"
              />
            </div>
            <Cmdk.List className="max-h-[min(60dvh,420px)] overflow-y-auto overscroll-contain p-2">
              <Cmdk.Empty className="px-3 py-8 text-center text-sm text-text-muted">
                {emptyText}
              </Cmdk.Empty>
              {children}
            </Cmdk.List>
          </Cmdk>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function CommandGroup({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Cmdk.Group
      heading={heading}
      className="pb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-text-subtle"
    >
      {children}
    </Cmdk.Group>
  );
}

export function CommandItem({
  value,
  keywords,
  icon,
  hint,
  onSelect,
  children,
  className,
}: {
  value: string;
  keywords?: string[];
  icon?: ReactNode;
  hint?: ReactNode;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Cmdk.Item
      value={value}
      {...(keywords ? { keywords } : {})}
      onSelect={onSelect}
      className={cn(
        "flex h-10 cursor-pointer select-none items-center gap-3 rounded-md px-3 text-sm text-text",
        "data-[selected=true]:bg-surface-hover data-[selected=true]:shadow-[inset_3px_0_0_var(--ep-accent)] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-text-subtle",
        className,
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint ? <span className="shrink-0 text-xs text-text-subtle">{hint}</span> : null}
    </Cmdk.Item>
  );
}
