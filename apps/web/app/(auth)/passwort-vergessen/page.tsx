import { defaults } from "@ep/config/defaults";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "../../../components/password-reset-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return { title: t("requestTitle") };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm validMinutes={defaults.auth.resetPasswordMinutes} />;
}
