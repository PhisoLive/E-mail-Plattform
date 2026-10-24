"use client";

import { Alert, Button, Card, CardBody, Field, Input } from "@ep/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { authClient, authErrorKey } from "../lib/auth-client";

export function ForgotPasswordForm({ validMinutes }: { validMinutes: number }) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/passwort-neu",
    });
    setPending(false);
    if (failure) {
      setError(t(authErrorKey(failure.code, failure.status) as never));
      return;
    }
    setSent(true);
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.reset.requestTitle")}</h1>
          <p className="text-sm text-text-muted">{t("auth.reset.requestText")}</p>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {sent ? (
          <Alert tone="success">{t("auth.reset.sent", { email, minutes: validMinutes })}</Alert>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field id="reset-email" label={t("common.email")}>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Button type="submit" loading={pending}>
              {t("auth.reset.requestSubmit")}
            </Button>
          </form>
        )}
        <p className="text-center text-sm">
          <Link
            className="font-medium text-accent underline-offset-4 hover:underline"
            href="/login"
          >
            {t("auth.reset.backToLogin")}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

export function NewPasswordForm({
  minLength,
  maxLength,
}: {
  minLength: number;
  maxLength: number;
}) {
  const t = useTranslations();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError || !token ? t("auth.errors.linkExpired") : null,
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (failure) {
      setError(t(authErrorKey(failure.code, failure.status) as never));
      return;
    }
    setDone(true);
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.reset.newTitle")}</h1>
          <p className="text-sm text-text-muted">{t("auth.reset.newText")}</p>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {done ? (
          <>
            <Alert tone="success">{t("auth.reset.done")}</Alert>
            <Link
              href="/login"
              className="text-center text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              {t("auth.reset.toLogin")}
            </Link>
          </>
        ) : token && !linkError ? (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field
              id="new-password"
              label={t("auth.reset.newPassword")}
              hint={t("auth.register.passwordHint", { min: minLength })}
            >
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={minLength}
                maxLength={maxLength}
                aria-describedby="new-password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Button type="submit" loading={pending}>
              {t("auth.reset.newSubmit")}
            </Button>
          </form>
        ) : (
          <Link
            href="/passwort-vergessen"
            className="text-center text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {t("auth.reset.requestAgain")}
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
