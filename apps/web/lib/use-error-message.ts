"use client";

import { defaults } from "@ep/config/defaults";
import { TRPCClientError } from "@trpc/client";
import { useTranslations } from "next-intl";
import { errorCode } from "./trpc";

/**
 * Text of an API error from de.json with its parameters. Thresholds that come from defaults.ts
 * are filled in here; counts and limits come with the error from the server (ErrorParams in
 * packages/core makes them mandatory) – no stand-in values that would hide a missing one.
 */
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations("errors");
  return (error) => {
    const params =
      error instanceof TRPCClientError
        ? ((error.data as { appError?: { params?: Record<string, string | number> } } | undefined)
            ?.appError?.params ?? {})
        : {};
    return t(errorCode(error), {
      threshold: defaults.preflight.authRequiredFromRecipients,
      mb: defaults.graph.maxMessageMb,
      ...params,
    });
  };
}
