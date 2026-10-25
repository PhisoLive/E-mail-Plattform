"use client";

import { Sparkles } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { Input, Textarea } from "./input";

export interface Suggestion {
  id: string;
  label: string;
  /** Value written into the field; defaults to the label. */
  value?: string;
}

export type SuggestOrWriteSource = "suggestion" | "free" | "ai";

export interface SuggestOrWriteProps {
  id?: string;
  label: ReactNode;
  /** 2–5 suggestions from rules or AI (concept chapter 13). More are cut off. */
  suggestions: Suggestion[];
  value: string;
  onChange: (value: string, source: SuggestOrWriteSource) => void;
  /** Free text input next to the chips (default: allowed). */
  allowFreeText?: boolean;
  multiline?: boolean;
  placeholder?: string;
  /** Completes missing parts ("Die KI ergänzt den Rest"); returns the completed text. */
  aiFill?: (current: string) => Promise<string>;
  aiFillLabel?: string;
  /** Short explanation shown under the label. */
  explain?: ReactNode;
  /** Hint under the field, e.g. "Die KI ergänzt den Rest." */
  hint?: ReactNode;
  /** Accessible name of the suggestion group, e.g. "Vorschläge". */
  suggestionsLabel: string;
  error?: ReactNode;
}

/**
 * "Auswählen oder selbst schreiben": suggestion chips, a free field and an optional AI
 * completion – one reusable component for every input point (concept chapters 1 and 13).
 */
export function SuggestOrWrite({
  id,
  label,
  suggestions,
  value,
  onChange,
  allowFreeText = true,
  multiline = false,
  placeholder,
  aiFill,
  aiFillLabel,
  explain,
  hint,
  suggestionsLabel,
  error,
}: SuggestOrWriteProps) {
  const generatedId = useId();
  const fieldId = id ?? `sow-${generatedId}`;
  const [filling, setFilling] = useState(false);
  const visible = suggestions.slice(0, 5);
  const suggestionValue = (suggestion: Suggestion) => suggestion.value ?? suggestion.label;
  const describedBy = [
    explain ? `${fieldId}-explain` : null,
    hint ? `${fieldId}-hint` : null,
    error ? `${fieldId}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");
  // The chips get the explanation too; without a text field they carry hint and error as well.
  const chipsDescribedBy = allowFreeText ? (explain ? `${fieldId}-explain` : "") : describedBy;

  async function runAiFill() {
    if (!aiFill) return;
    setFilling(true);
    try {
      onChange(await aiFill(value), "ai");
    } finally {
      setFilling(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        {allowFreeText ? (
          <label htmlFor={fieldId} className="text-[13px] font-medium text-text">
            {label}
          </label>
        ) : (
          // Without a text field the chips are the control: the label names their group.
          <p id={`${fieldId}-label`} className="text-[13px] font-medium text-text">
            {label}
          </p>
        )}
        {explain ? (
          <p id={`${fieldId}-explain`} className="text-xs text-text-muted">
            {explain}
          </p>
        ) : null}
      </div>
      {visible.length > 0 ? (
        <fieldset
          className="flex flex-wrap gap-2"
          {...(allowFreeText ? {} : { "aria-labelledby": `${fieldId}-label` })}
          {...(chipsDescribedBy ? { "aria-describedby": chipsDescribedBy } : {})}
        >
          {allowFreeText ? <legend className="sr-only">{suggestionsLabel}</legend> : null}
          {visible.map((suggestion) => {
            const selected = value === suggestionValue(suggestion);
            return (
              <button
                key={suggestion.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(suggestionValue(suggestion), "suggestion")}
                className={cn(
                  "rounded-full border px-3 py-1 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
                  selected
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border-strong bg-surface text-text hover:bg-surface-hover",
                )}
              >
                {suggestion.label}
              </button>
            );
          })}
        </fieldset>
      ) : null}
      {allowFreeText ? (
        multiline ? (
          <Textarea
            id={fieldId}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value, "free")}
            invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
          />
        ) : (
          <Input
            id={fieldId}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value, "free")}
            invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
          />
        )
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {hint ? (
          <p
            id={`${fieldId}-hint`}
            className="inline-flex items-center gap-1 text-xs text-text-muted"
          >
            <Sparkles aria-hidden="true" className="size-3.5 text-accent" />
            {hint}
          </p>
        ) : (
          <span />
        )}
        {aiFill && aiFillLabel ? (
          <Button
            variant="soft"
            size="sm"
            onClick={runAiFill}
            loading={filling}
            icon={<Sparkles aria-hidden="true" />}
          >
            {aiFillLabel}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
