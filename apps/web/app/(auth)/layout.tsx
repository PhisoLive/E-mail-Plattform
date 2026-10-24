import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("app");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight text-text"
      >
        <span aria-hidden="true" className="inline-block size-7 rounded-md bg-accent" />
        {t("name")}
      </Link>
      <main id="inhalt" className="w-full max-w-sm">
        {children}
      </main>
    </div>
  );
}
