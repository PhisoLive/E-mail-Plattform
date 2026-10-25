"use client";

import { Alert, Button, Card, CardBody, CardHeader, Field, Input, Segmented, toast } from "@ep/ui";
import { KeyRound, Monitor, Moon, Palette, Sun, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { authClient, authErrorKey } from "../../lib/auth-client";
import type { ThemePreference } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";

export function ProfileDetails({
  name,
  email,
  maxNameLength,
}: {
  name: string;
  email: string;
  maxNameLength: number;
}) {
  const t = useTranslations("profile");
  const tRoot = useTranslations();
  const [value, setValue] = useState(name);
  const [saved, setSaved] = useState(name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.updateUser({ name: value.trim() });
    setPending(false);
    if (failure) {
      setError(tRoot(authErrorKey(failure.code, failure.status) as never));
      return;
    }
    setSaved(value.trim());
    toast.success(t("nameSaved"));
  }

  return (
    <Card>
      <CardHeader icon={<UserRound aria-hidden="true" />} title={t("detailsTitle")} />
      <CardBody>
        <form method="post" className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field id="profile-name" label={t("name")} hint={t("nameHint")}>
            <Input
              id="profile-name"
              autoComplete="name"
              required
              minLength={1}
              maxLength={maxNameLength}
              aria-describedby="profile-name-hint"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
          <Field id="profile-email" label={t("email")} hint={t("emailHint")}>
            <Input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              aria-describedby="profile-email-hint"
              className="bg-surface-muted"
            />
          </Field>
          {error ? (
            <Alert tone="danger" className="sm:col-span-2">
              {error}
            </Alert>
          ) : null}
          <div className="flex justify-end sm:col-span-2">
            <Button
              type="submit"
              variant="secondary"
              loading={pending}
              disabled={value.trim().length === 0 || value.trim() === saved}
            >
              {t("saveName")}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function AppearanceSettings() {
  const t = useTranslations("profile");
  const [theme, setTheme] = useTheme();
  return (
    <Card>
      <CardHeader
        icon={<Palette aria-hidden="true" />}
        title={t("appearanceTitle")}
        description={t("appearanceHint")}
      />
      <CardBody>
        <Segmented<ThemePreference>
          label={t("appearanceTitle")}
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light", label: t("themeLight"), icon: <Sun aria-hidden="true" /> },
            { value: "dark", label: t("themeDark"), icon: <Moon aria-hidden="true" /> },
            { value: "system", label: t("themeSystem"), icon: <Monitor aria-hidden="true" /> },
          ]}
        />
      </CardBody>
    </Card>
  );
}

export function PasswordChange({ minLength, maxLength }: { minLength: number; maxLength: number }) {
  const t = useTranslations("profile");
  const tRoot = useTranslations();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (failure) {
      setError(tRoot(authErrorKey(failure.code, failure.status) as never));
      return;
    }
    setCurrent("");
    setNext("");
    toast.success(t("passwordChanged"));
  }

  return (
    <Card>
      <CardHeader
        icon={<KeyRound aria-hidden="true" />}
        title={t("passwordTitle")}
        description={t("passwordHint")}
      />
      <CardBody>
        <form method="post" className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field id="password-current" label={t("currentPassword")}>
            <Input
              id="password-current"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </Field>
          <Field
            id="password-new"
            label={t("newPassword")}
            hint={t("newPasswordHint", { min: minLength })}
          >
            <Input
              id="password-new"
              type="password"
              autoComplete="new-password"
              required
              minLength={minLength}
              maxLength={maxLength}
              aria-describedby="password-new-hint"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </Field>
          {error ? (
            <Alert tone="danger" className="sm:col-span-2">
              {error}
            </Alert>
          ) : null}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" variant="secondary" loading={pending}>
              {t("changePassword")}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
