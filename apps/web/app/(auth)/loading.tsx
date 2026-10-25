import { Skeleton } from "@ep/ui";
import { getTranslations } from "next-intl/server";

/** Skeleton while the page loads (concept chapter 13: every page has a loading state). */
export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div role="status" aria-live="polite" className="flex w-full max-w-md flex-col gap-4">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
