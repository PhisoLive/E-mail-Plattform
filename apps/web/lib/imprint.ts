import {
  imprintParts,
  type SenderProfileData,
  type WorkspaceCountry,
  type WorkspaceKind,
} from "@ep/core/sender/legal-forms";
import type { useTranslations } from "next-intl";

type ImprintTranslator = ReturnType<typeof useTranslations<"imprint">>;

/**
 * The mandatory details as text lines – the same everywhere they appear (signature preview,
 * unsubscribe page and, from phase 4, under every business mail).
 */
export function imprintLines(
  profile: SenderProfileData,
  workspace: { kind: WorkspaceKind; country: WorkspaceCountry },
  t: ImprintTranslator,
): string[] {
  return imprintParts(profile, workspace).map((part) =>
    part.key === "legalForm"
      ? t("legalForm", { name: t(`legalForms.${part.values.law}.${part.values.form}`) })
      : t(part.key, part.values),
  );
}
