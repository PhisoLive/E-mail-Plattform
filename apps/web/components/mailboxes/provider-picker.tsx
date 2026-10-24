"use client";

import { Alert, Badge, Card, CardBody, CardHeader, Field, Input } from "@ep/ui";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChoiceCards } from "../choice-cards";

const providers = [
  "gmx",
  "webde",
  "tonline",
  "ionos",
  "gmail",
  "outlook",
  "strato",
  "other",
] as const;
type Provider = (typeof providers)[number];

/** First step of connecting a mailbox: choose the provider, see what to prepare (chapter 5). */
export function ProviderPicker() {
  const t = useTranslations("connectMailbox");
  const tCommon = useTranslations("common");
  const [provider, setProvider] = useState<Provider | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <ChoiceCards<Provider>
        name="provider"
        legend={t("providerLegend")}
        value={provider}
        onChange={setProvider}
        choices={providers.map((key) => ({
          value: key,
          title: t(`providers.${key}.name`),
          description: t(`providers.${key}.kind`),
          icon: <span>{t(`providers.${key}.name`).slice(0, 1)}</span>,
        }))}
      />
      {provider ? (
        <Card>
          <CardHeader
            title={t("prepareTitle", { provider: t(`providers.${provider}.name`) })}
            action={<Badge tone="info">{tCommon("soon")}</Badge>}
          />
          <CardBody className="flex flex-col gap-4">
            <Alert tone="info">
              <span className="flex items-start gap-2">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {t(`providers.${provider}.hint`)}
              </span>
            </Alert>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="mailbox-email" label={t("email")}>
                <Input
                  id="mailbox-email"
                  type="email"
                  disabled
                  placeholder={t("emailPlaceholder")}
                />
              </Field>
              <Field id="mailbox-password" label={t("password")} hint={t("passwordHint")}>
                <Input
                  id="mailbox-password"
                  type="password"
                  disabled
                  aria-describedby="mailbox-password-hint"
                />
              </Field>
            </div>
            <p className="text-[13px] text-text-muted">{t("soonText")}</p>
          </CardBody>
        </Card>
      ) : (
        <p className="text-sm text-text-muted">{t("chooseFirst")}</p>
      )}
    </div>
  );
}
