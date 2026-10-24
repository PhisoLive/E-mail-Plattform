import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-text-subtle">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-text sm:text-2xl">
          {title}
        </h1>
        {description ? <p className="max-w-2xl text-sm text-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
