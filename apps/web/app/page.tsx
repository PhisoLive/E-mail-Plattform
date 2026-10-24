import { Button } from "@ep/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations();
  return (
    <main
      id="inhalt"
      className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4"
    >
      <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span aria-hidden="true" className="inline-block size-7 rounded-md bg-accent" />
        {t("app.name")}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">{t("app.tagline")}</h1>
      <div className="flex gap-3">
        <Link href="/registrieren">
          <Button size="lg">{t("auth.register.submit")}</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary">
            {t("auth.login.submit")}
          </Button>
        </Link>
      </div>
    </main>
  );
}
