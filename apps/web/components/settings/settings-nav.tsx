"use client";

import { cn } from "@ep/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { settingsNav } from "../shell/nav";

/** Sections of the settings: a scrollable row on small screens, a column from 1024 px. */
export function SettingsNav() {
  const t = useTranslations("settingsNav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="-mx-4 min-w-0 sm:mx-0 lg:w-52 lg:shrink-0">
      <ul className="flex gap-1 overflow-x-auto px-4 pb-1 sm:px-0 lg:sticky lg:top-10 lg:flex-col lg:overflow-visible">
        {settingsNav.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.key} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center rounded-md px-3 text-[13.5px] whitespace-nowrap transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
                  active
                    ? "bg-surface font-medium text-text shadow-sm ring-1 ring-border"
                    : "text-text-muted hover:bg-surface-hover hover:text-text",
                )}
              >
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
