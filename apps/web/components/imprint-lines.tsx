"use client";

import type {
  SenderProfileData,
  WorkspaceCountry,
  WorkspaceKind,
} from "@ep/core/sender/legal-forms";
import { useTranslations } from "next-intl";
import { imprintLines } from "../lib/imprint";

/** The mandatory details as text lines (same source as the unsubscribe page). */
export function useImprintLines(
  profile: SenderProfileData,
  workspace: { kind: WorkspaceKind; country: WorkspaceCountry },
): string[] {
  const t = useTranslations("imprint");
  return imprintLines(profile, workspace, t);
}
