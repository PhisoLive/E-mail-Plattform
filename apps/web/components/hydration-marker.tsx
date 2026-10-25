"use client";

import { useEffect } from "react";

/**
 * Marks <html data-hydrated> once the root is interactive – E2E tests wait for it before typing.
 * Content inside Suspense boundaries may hydrate later; submit buttons therefore stay disabled
 * until their own form is hydrated (Button in packages/ui), so nothing is submitted natively.
 */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return null;
}
