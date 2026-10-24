import { defaults } from "@ep/config/defaults";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { RegisterForm } from "../../../components/auth-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm minPasswordLength={defaults.auth.passwordMinLength} />
    </Suspense>
  );
}
