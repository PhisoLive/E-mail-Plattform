import { defaults } from "@ep/config/defaults";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { NewPasswordForm } from "../../../components/password-reset-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return { title: t("newTitle") };
}

export default function NewPasswordPage() {
  return (
    <Suspense>
      <NewPasswordForm
        minLength={defaults.auth.passwordMinLength}
        maxLength={defaults.auth.passwordMaxLength}
      />
    </Suspense>
  );
}
