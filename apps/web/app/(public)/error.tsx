"use client";

import { Button, Card, CardBody } from "@ep/ui";
import { useTranslations } from "next-intl";

/** Error state for recipients (formal address, no links into the platform – E-042). */
export default function PublicError({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("publicPages.error");
  return (
    <Card className="w-full max-w-md">
      <CardBody className="flex flex-col gap-3 pt-6">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-text-muted">{t("text")}</p>
        <div>
          <Button variant="secondary" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
