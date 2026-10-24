"use client";

import { Alert, Button, Card, CardBody, CardHeader, Field, Input } from "@ep/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { type FormEvent, useState } from "react";
import { authClient, authErrorKey } from "../lib/auth-client";

type Step = "idle" | "password" | "verify" | "done";

export function TwoFactorSetup({ enabled, required }: { enabled: boolean; required: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>(enabled ? "done" : "idle");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [uri, setUri] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  async function onPassword(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: failure } = await authClient.twoFactor.enable({ password });
    setPending(false);
    if (failure || !data || data.method !== "totp") {
      setError(t(authErrorKey(failure?.code) as never));
      return;
    }
    setUri(data.totpURI);
    setBackupCodes(data.backupCodes);
    setQr(await QRCode.toDataURL(data.totpURI, { margin: 1, width: 192 }));
    setStep("verify");
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.twoFactor.verifyTotp({
      code: code.replace(/\s+/g, ""),
    });
    setPending(false);
    if (failure) {
      setError(t(authErrorKey(failure.code) as never));
      return;
    }
    setJustEnabled(true);
    setStep("done");
    router.refresh();
  }

  const secret = uri ? new URL(uri).searchParams.get("secret") : null;

  return (
    <Card>
      <CardHeader title={t("settings.profile.twoFactorTitle")} />
      <CardBody className="flex flex-col gap-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {step === "done" ? (
          <>
            <Alert tone="success">
              {justEnabled ? t("settings.profile.enabled") : t("settings.profile.twoFactorOn")}
            </Alert>
            {justEnabled && backupCodes.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm">{t("settings.profile.backupCodes")}</p>
                <ul className="grid grid-cols-2 gap-1 font-mono text-sm tabular">
                  {backupCodes.map((backup) => (
                    <li key={backup}>{backup}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
        {step === "idle" ? (
          <>
            <Alert tone={required ? "warning" : "info"}>
              {required
                ? t("settings.profile.twoFactorRequired")
                : t("settings.profile.twoFactorOff")}
            </Alert>
            <div>
              <Button onClick={() => setStep("password")}>{t("settings.profile.enable")}</Button>
            </div>
          </>
        ) : null}
        {step === "password" ? (
          <form className="flex max-w-sm flex-col gap-4" onSubmit={onPassword}>
            <Field id="tf-password" label={t("settings.profile.passwordConfirm")}>
              <Input
                id="tf-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <div>
              <Button type="submit" loading={pending}>
                {t("common.continue")}
              </Button>
            </div>
          </form>
        ) : null}
        {step === "verify" && uri ? (
          <form className="flex flex-col gap-4" onSubmit={onVerify}>
            <p className="text-sm">{t("settings.profile.scanQr")}</p>
            <div
              className="flex flex-wrap items-center gap-4"
              data-testid="otpauth-uri"
              data-uri={uri}
            >
              {/* biome-ignore lint/performance/noImgElement: data URL QR code, no optimisation needed */}
              {qr ? (
                <img
                  src={qr}
                  alt=""
                  width={192}
                  height={192}
                  className="rounded-md border border-border bg-white p-1"
                />
              ) : null}
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-text-muted">{t("settings.profile.secretLabel")}</span>
                <code className="break-all font-mono">{secret}</code>
              </div>
            </div>
            <div className="max-w-sm">
              <Field id="tf-code" label={t("settings.profile.confirmCode")}>
                <Input
                  id="tf-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </Field>
            </div>
            <div>
              <Button type="submit" loading={pending}>
                {t("settings.profile.confirm")}
              </Button>
            </div>
          </form>
        ) : null}
      </CardBody>
    </Card>
  );
}
