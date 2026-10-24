"use client";

import { cn } from "@ep/ui";
import type { ReactNode } from "react";

export interface Choice<T extends string> {
  value: T;
  title: string;
  description?: string;
  icon?: ReactNode;
}

/** Large radio cards (native radios – keyboard and screen readers work as usual). */
export function ChoiceCards<T extends string>({
  name,
  legend,
  choices,
  value,
  onChange,
  columns = "sm:grid-cols-2 lg:grid-cols-4",
}: {
  name: string;
  legend: string;
  choices: Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={cn("grid gap-3", columns)}>
        {choices.map((choice) => {
          const checked = value === choice.value;
          return (
            <label
              key={choice.value}
              className={cn(
                "relative flex cursor-pointer items-start gap-3 rounded-lg border bg-surface px-4 py-3.5 shadow-sm transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                checked
                  ? "border-accent ring-1 ring-accent"
                  : "border-border hover:border-border-strong",
              )}
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="sr-only"
              />
              {choice.icon ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold [&_svg]:size-[18px]",
                    checked ? "bg-accent text-accent-text" : "bg-surface-muted text-text-muted",
                  )}
                >
                  {choice.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-text">{choice.title}</span>
                {choice.description ? (
                  <span className="text-xs text-text-muted">{choice.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
