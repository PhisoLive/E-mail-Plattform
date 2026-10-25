"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False while the server HTML is shown and during hydration, true once this component is live. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
