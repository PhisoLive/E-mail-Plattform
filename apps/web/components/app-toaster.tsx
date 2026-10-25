"use client";

import { Toaster } from "@ep/ui";
import { useTranslations } from "next-intl";
import { useTheme } from "../lib/use-theme";

/**
 * Toasts for the whole app. Lives in the root layout, so a message survives the change between
 * the app area and the operator area (separate route groups, E-048).
 */
export function AppToaster() {
  const t = useTranslations("shell");
  const tCommon = useTranslations("common");
  const [theme] = useTheme();
  return <Toaster closeLabel={tCommon("close")} label={t("notifications")} theme={theme} />;
}
