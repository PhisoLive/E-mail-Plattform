"use client";

import { Alert, Button, Card, CardBody, Field, Input } from "@ep/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { authClient, authErrorKey, safeNext } from "../lib/auth-client";

function useT() {
  const t = useTranslations();
  return (key: string, values?: Record<string, string | number>) =>
    t(key as never, values as never);
}

/**
 * Better Auth redirects failed magic links and e-mail verifications with `?error=…` – either
 * directly to /login or inside the `next` target (verification callback behind the login).
 */
function linkError(params: URLSearchParams, t: (key: string) => string): string | null {
  const nested = params.get("next");
  const code =
    params.get("error") ??
    (nested ? new URLSearchParams(nested.split("?")[1] ?? "").get("error") : null);
  if (!code) return null;
  if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN" || code === "USER_NOT_FOUND") {
    return t(
      nested?.startsWith("/willkommen") ? "auth.errors.verifyFailed" : "auth.errors.linkExpired",
    );
  }
  return t("auth.errors.linkExpired");
}

export function LoginForm({ magicLinkMinutes }: { magicLinkMinutes: number }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => linkError(params, t));
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState<"password" | "magic" | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending("password");
    setError(null);
    setInfo(null);
    const { data, error: failure } = await authClient.signIn.email({
      email,
      password,
      callbackURL: next,
    });
    setPending(null);
    if (failure) {
      setError(t(authErrorKey(failure.code, failure.status)));
      return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      router.push(`/login/zwei-faktor?next=${encodeURIComponent(next)}`);
      return;
    }
    window.location.assign(next);
  }

  async function onMagicLink() {
    if (!email) {
      setError(t("errors.VALIDATION"));
      return;
    }
    setPending("magic");
    setError(null);
    const { error: failure } = await authClient.signIn.magicLink({
      email,
      callbackURL: next,
      errorCallbackURL: "/login",
    });
    setPending(null);
    if (failure) setError(t(authErrorKey(failure.code, failure.status)));
    else setInfo(t("auth.login.magicLinkSent", { email, minutes: magicLinkMinutes }));
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.login.title")}</h1>
          <p className="text-sm text-text-muted">{t("auth.login.subtitle")}</p>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {info ? <Alert tone="success">{info}</Alert> : null}
        <form method="post" className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Field id="email" label={t("common.email")}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field id="password" label={t("common.password")}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Link
            href="/passwort-vergessen"
            className="-mt-2 self-end text-[13px] text-text-muted underline-offset-4 hover:text-text hover:underline"
          >
            {t("auth.login.forgot")}
          </Link>
          <Button type="submit" loading={pending === "password"}>
            {t("auth.login.submit")}
          </Button>
        </form>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border" />
          {t("common.or")}
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="secondary" onClick={onMagicLink} loading={pending === "magic"}>
          {t("auth.login.magicLink")}
        </Button>
        <p className="text-center text-sm text-text-muted">
          {t("auth.login.noAccount")}{" "}
          <Link
            className="font-medium text-accent underline-offset-4 hover:underline"
            href={`/registrieren?next=${encodeURIComponent(next)}`}
          >
            {t("auth.login.toRegister")}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

export function TwoFactorForm() {
  const t = useT();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.twoFactor.verifyTotp({
      code: code.replace(/\s+/g, ""),
    });
    setPending(false);
    if (failure) {
      setError(t(authErrorKey(failure.code, failure.status)));
      return;
    }
    window.location.assign(next);
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.twoFactor.title")}</h1>
          <p className="text-sm text-text-muted">{t("auth.twoFactor.subtitle")}</p>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <form method="post" className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field id="code" label={t("auth.twoFactor.codeLabel")}>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={8}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="tabular text-center text-lg tracking-[0.3em]"
            />
          </Field>
          <Button type="submit" loading={pending}>
            {t("auth.twoFactor.submit")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export function RegisterForm({ minPasswordLength }: { minPasswordLength: number }) {
  const t = useT();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/willkommen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < minPasswordLength) {
      setError(t("auth.register.passwordTooShort", { min: String(minPasswordLength) }));
      return;
    }
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: next,
    });
    setPending(false);
    if (failure) {
      setError(t(authErrorKey(failure.code, failure.status), { min: String(minPasswordLength) }));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardBody className="flex flex-col gap-3 py-6">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.verify.title")}</h1>
          <p className="text-sm">{t("auth.verify.text", { email })}</p>
          <p className="text-sm text-text-muted">{t("auth.verify.hint")}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.register.title")}</h1>
          <p className="text-sm text-text-muted">{t("auth.register.subtitle")}</p>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <form method="post" className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Field id="name" label={t("auth.register.nameLabel")}>
            <Input
              id="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field id="email" label={t("common.email")}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field
            id="password"
            label={t("common.password")}
            hint={t("auth.register.passwordHint", { min: String(minPasswordLength) })}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={minPasswordLength}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby="password-hint"
            />
          </Field>
          <Button type="submit" loading={pending}>
            {t("auth.register.submit")}
          </Button>
        </form>
        <p className="text-center text-sm text-text-muted">
          {t("auth.register.haveAccount")}{" "}
          <Link
            className="font-medium text-accent underline-offset-4 hover:underline"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            {t("auth.register.toLogin")}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
