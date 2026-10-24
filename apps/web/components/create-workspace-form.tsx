"use client";

import { Alert, Button, Card, CardBody, Field, Input } from "@ep/ui";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { errorCode, useTRPC } from "../lib/trpc";
import { selectWorkspace } from "../lib/workspace-store";

const selectClass =
  "h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus";

export function CreateWorkspaceForm() {
  const t = useTranslations();
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"business" | "private">("business");
  const [country, setCountry] = useState<"DE" | "AT" | "CH" | "other">("DE");
  const create = useMutation(
    trpc.workspace.create.mutationOptions({
      onSuccess: async (workspace) => {
        await selectWorkspace(workspace.id);
        // Full navigation: the whole shell changes with the workspace.
        window.location.assign("/start");
      },
    }),
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate({ name, kind, country });
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardBody className="flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {t("onboarding.createWorkspace.title")}
          </h1>
          <p className="text-sm text-text-muted">{t("onboarding.createWorkspace.subtitle")}</p>
        </div>
        {create.error ? (
          <Alert tone="danger">{t(`errors.${errorCode(create.error)}`)}</Alert>
        ) : null}
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field id="workspace-name" label={t("onboarding.createWorkspace.nameLabel")}>
            <Input
              id="workspace-name"
              required
              minLength={2}
              maxLength={80}
              placeholder={t("onboarding.createWorkspace.namePlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">
              {t("onboarding.createWorkspace.kindLabel")}
            </legend>
            {(["business", "private"] as const).map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  className="accent-[var(--ep-accent)]"
                />
                {t(
                  value === "business"
                    ? "onboarding.createWorkspace.kindBusiness"
                    : "onboarding.createWorkspace.kindPrivate",
                )}
              </label>
            ))}
          </fieldset>
          <Field id="workspace-country" label={t("onboarding.createWorkspace.countryLabel")}>
            <select
              id="workspace-country"
              className={selectClass}
              value={country}
              onChange={(event) => setCountry(event.target.value as typeof country)}
            >
              <option value="DE">{t("onboarding.createWorkspace.countryDE")}</option>
              <option value="AT">{t("onboarding.createWorkspace.countryAT")}</option>
              <option value="CH">{t("onboarding.createWorkspace.countryCH")}</option>
              <option value="other">{t("onboarding.createWorkspace.countryOther")}</option>
            </select>
          </Field>
          <Button type="submit" loading={create.isPending}>
            {t("onboarding.createWorkspace.submit")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
