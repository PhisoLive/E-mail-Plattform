import { Skeleton } from "@ep/ui";
import { getTranslations } from "next-intl/server";

/** Skeleton while a page of the app loads (concept chapter 13: every page has a loading state). */
export default async function AppLoading() {
  const t = await getTranslations("common");
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("loading")}</span>
      <div className="flex flex-col gap-2 pb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}
