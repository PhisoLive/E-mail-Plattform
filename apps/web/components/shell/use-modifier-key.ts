"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

function isApple(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.userAgent);
}

/** "⌘" on Apple devices, the Ctrl key name elsewhere. The server renders the Ctrl key name. */
export function useModifierKey(): string {
  const t = useTranslations("shell");
  const apple = useSyncExternalStore(noop, isApple, () => false);
  return apple ? "⌘" : t("ctrlKey");
}
