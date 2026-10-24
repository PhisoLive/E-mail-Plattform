"use client";

import { Button } from "@ep/ui";
import { useTranslations } from "next-intl";
import { authClient } from "../lib/auth-client";

export function SignOutButton() {
  const t = useTranslations("common");
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await authClient.signOut();
        window.location.assign("/login");
      }}
    >
      {t("signOut")}
    </Button>
  );
}
