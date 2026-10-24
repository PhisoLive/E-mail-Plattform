import { buttonClasses } from "@ep/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { BrandMark } from "../../components/shell/sidebar";

const legal = [
  { href: "/impressum", key: "imprint" },
  { href: "/datenschutz", key: "privacy" },
  { href: "/agb", key: "terms" },
  { href: "/avv", key: "dpa" },
] as const;

/** Public website (concept chapter 13). */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("site");
  const tApp = await getTranslations("app");
  const tCommon = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md"
      >
        {tCommon("skipToContent")}
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link
            href="/"
            className="mr-auto flex min-w-0 items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-focus"
          >
            <BrandMark />
            <span className="sr-only truncate min-[420px]:not-sr-only">{tApp("name")}</span>
          </Link>
          <nav aria-label={t("nav")} className="flex items-center gap-1">
            <Link href="/preise" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              {t("pricingLink")}
            </Link>
            <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              {t("login")}
            </Link>
            <Link href="/registrieren" className={buttonClasses({ size: "sm" })}>
              {t("register")}
            </Link>
          </nav>
        </div>
      </header>
      <main id="inhalt" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[13px] text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t("footer", { name: tApp("name") })}</p>
          <nav aria-label={t("legalNav")}>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-sm hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    {t(`legal.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
