import { cn } from "@ep/ui";

/**
 * Logo mark: two overlapping rounded shapes in the accent colour – an envelope abstracted.
 * Its own module, so pages without the app shell (website, sign-in) do not load the shell
 * code and its navigation.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      fill="none"
    >
      <rect x="2" y="4" width="20" height="16" rx="5" className="fill-accent" />
      <path
        d="M6.5 9.5 12 13l5.5-3.5"
        className="stroke-accent-text"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
