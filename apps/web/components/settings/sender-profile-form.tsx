"use client";

import {
  designationHints,
  directorsRole,
  isLegalForm,
  type LegalForm,
  legalFormsFor,
  optionalSenderFields,
  requiredSenderFields,
  type SenderField,
  type SenderFieldError,
  validateSenderProfile,
} from "@ep/core/sender/legal-forms";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Select,
  Textarea,
  toast,
} from "@ep/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useMemo, useState } from "react";
import { useTRPC } from "../../lib/trpc";
import { useErrorMessage } from "../../lib/use-error-message";
import { useImprintLines } from "../imprint-lines";

interface FormState {
  legalForm: LegalForm | "";
  companyName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  seat: string;
  registerCourt: string;
  registerNumber: string;
  managingDirectors: string;
  supervisoryBoardChair: string;
  generalPartnerName: string;
  generalPartnerSeat: string;
  generalPartnerRegisterCourt: string;
  generalPartnerRegisterNumber: string;
  vatId: string;
  phone: string;
  website: string;
  privacyUrl: string;
}

const countries = ["DE", "AT", "CH", "LI", "LU", "BE", "NL", "FR", "IT", "PL", "CZ", "DK"] as const;

type TextField = Exclude<SenderField, "legalForm" | "country">;

function toInput(state: FormState) {
  const value = (text: string) => (text.trim() ? text : null);
  return {
    legalForm: state.legalForm || null,
    companyName: value(state.companyName),
    address: {
      street: value(state.street),
      postalCode: value(state.postalCode),
      city: value(state.city),
      country: state.country,
    },
    seat: value(state.seat),
    registerCourt: value(state.registerCourt),
    registerNumber: value(state.registerNumber),
    managingDirectors: value(state.managingDirectors),
    supervisoryBoardChair: value(state.supervisoryBoardChair),
    generalPartner: {
      name: value(state.generalPartnerName),
      seat: value(state.generalPartnerSeat),
      registerCourt: value(state.generalPartnerRegisterCourt),
      registerNumber: value(state.generalPartnerRegisterNumber),
    },
    vatId: value(state.vatId),
    phone: value(state.phone),
    website: value(state.website),
    privacyUrl: value(state.privacyUrl),
  };
}

/**
 * Sender profile with the mandatory details per legal form. Whether the user may edit comes from
 * the same request as the data, so both always belong to the same workspace. The editor is only
 * rebuilt after an own save – a background refetch (reconnect, focus) keeps what was typed.
 */
export function SenderProfileForm({
  onSaved,
  compact = false,
}: {
  onSaved?: () => void;
  compact?: boolean;
}) {
  const t = useTranslations("senderProfile");
  const errorMessage = useErrorMessage();
  const trpc = useTRPC();
  const query = useQuery(trpc.senderProfile.get.queryOptions());
  const [version, setVersion] = useState(0);

  if (query.isPending) return <LoadingState label={t("loading")} lines={6} />;
  // A failed refetch in the background keeps the editor and what was typed.
  if (!query.data)
    return (
      <ErrorState
        title={t("loadError")}
        description={errorMessage(query.error)}
        action={
          <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
            {t("retry")}
          </Button>
        }
      />
    );
  const { profile, workspace } = query.data;
  return (
    <>
      {query.error ? (
        <Alert tone="warning" className="mb-4">
          {t("refreshError")}
        </Alert>
      ) : null}
      <SenderProfileEditor
        key={version}
        initial={{
          legalForm: profile.legalForm ?? "",
          companyName: profile.companyName ?? "",
          street: profile.address.street ?? "",
          postalCode: profile.address.postalCode ?? "",
          city: profile.address.city ?? "",
          country: profile.address.country,
          seat: profile.seat ?? "",
          registerCourt: profile.registerCourt ?? "",
          registerNumber: profile.registerNumber ?? "",
          managingDirectors: profile.managingDirectors ?? "",
          supervisoryBoardChair: profile.supervisoryBoardChair ?? "",
          generalPartnerName: profile.generalPartner?.name ?? "",
          generalPartnerSeat: profile.generalPartner?.seat ?? "",
          generalPartnerRegisterCourt: profile.generalPartner?.registerCourt ?? "",
          generalPartnerRegisterNumber: profile.generalPartner?.registerNumber ?? "",
          vatId: profile.vatId ?? "",
          phone: profile.phone ?? "",
          website: profile.website ?? "",
          privacyUrl: profile.privacyUrl ?? "",
        }}
        workspace={workspace}
        complete={query.data.complete}
        canEdit={query.data.canEdit}
        compact={compact}
        onStored={() => {
          setVersion((current) => current + 1);
          // The editor is rebuilt with the saved values; keep the keyboard position.
          requestAnimationFrame(() =>
            document.getElementById("sender-save")?.focus({ preventScroll: true }),
          );
          onSaved?.();
        }}
      />
    </>
  );
}

function SenderProfileEditor({
  initial,
  workspace,
  complete,
  canEdit,
  compact,
  onStored,
}: {
  initial: FormState;
  workspace: { kind: "business" | "private"; country: "DE" | "AT" | "CH" | "other" };
  complete: boolean;
  canEdit: boolean;
  compact: boolean;
  /** Called once the saved profile has been read back. */
  onStored: () => void;
}) {
  const t = useTranslations("senderProfile");
  const errorMessage = useErrorMessage();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [state, setState] = useState<FormState>(initial);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SenderField, SenderFieldError>>>(
    {},
  );
  const business = workspace.kind === "business";
  const form = state.legalForm || null;
  // The rules follow the country of the sender address (Germany, Austria, Switzerland).
  const required = useMemo(
    () => requiredSenderFields(form, { kind: workspace.kind, country: state.country }),
    [form, workspace.kind, state.country],
  );
  const optional = useMemo(
    () => optionalSenderFields(form, { kind: workspace.kind, country: state.country }),
    [form, workspace.kind, state.country],
  );
  const shown = (field: SenderField) => required.includes(field) || optional.includes(field);
  const isRequired = (field: SenderField) => required.includes(field);
  const role = directorsRole(form, state.country);
  const countryKey = state.country === "AT" ? "AT" : state.country === "CH" ? "CH" : "DE";
  // Associations have their own registers (Vereinsregister, ZVR in Austria); German
  // partnerships, cooperatives and partnerships of professions have their own register parts.
  const registerKey = form === "ev" ? (`${countryKey}ev` as const) : countryKey;
  const numberHintKey =
    countryKey === "DE" && form && ["ek", "ohg", "kg", "gmbh_co_kg"].includes(form)
      ? "DEhra"
      : countryKey === "DE" && form === "eg"
        ? "DEeg"
        : countryKey === "DE" && form === "partg"
          ? "DEpartg"
          : registerKey;
  const offeredForms = legalFormsFor(state.country);
  const formOptions = form && !offeredForms.includes(form) ? [...offeredForms, form] : offeredForms;

  const save = useMutation(
    trpc.senderProfile.update.mutationOptions({
      onSuccess: async () => {
        setFieldErrors({});
        toast.success(t("saved"));
        await queryClient.invalidateQueries({ queryKey: trpc.senderProfile.get.queryKey() });
        await queryClient.invalidateQueries({ queryKey: trpc.workspace.onboarding.queryKey() });
        onStored();
      },
      onError: (error) => {
        const fields = (
          error.data as { appError?: { fields?: Record<string, string> } } | undefined
        )?.appError?.fields;
        if (fields) setFieldErrors(fields as Partial<Record<SenderField, SenderFieldError>>);
      },
    }),
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key as SenderField];
      return next;
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const input = toInput(state);
    const local = validateSenderProfile(input, workspace);
    if (!local.ok) {
      setFieldErrors((local.error.fields ?? {}) as Partial<Record<SenderField, SenderFieldError>>);
      const first = Object.keys(local.error.fields ?? {})[0];
      if (first) document.getElementById(`sender-${first}`)?.focus();
      return;
    }
    save.mutate(input);
  }

  const errorText = (field: SenderField) => {
    const error = fieldErrors[field];
    if (field === "legalForm" && error === "invalid") return t("legalFormUnavailable");
    return error ? t(`fieldErrors.${error}`) : undefined;
  };

  const textField = (
    field: TextField,
    options: {
      multiline?: boolean;
      autoComplete?: string;
      inputMode?: "tel" | "url" | "numeric";
      label?: string;
      hint?: string;
    } = {},
  ) => {
    if (!shown(field)) return null;
    const id = `sender-${field}`;
    const error = errorText(field);
    const common = {
      id,
      value: state[field],
      disabled: !canEdit,
      invalid: Boolean(error),
      required: isRequired(field),
      "aria-required": isRequired(field) || undefined,
      ...(error
        ? { "aria-describedby": `${id}-error` }
        : options.hint
          ? { "aria-describedby": `${id}-hint` }
          : {}),
    };
    return (
      <Field
        id={id}
        label={options.label ?? t(`fields.${field}`)}
        requiredMark={isRequired(field) ? t("requiredMark") : undefined}
        hint={options.hint}
        error={error}
        className={options.multiline ? "sm:col-span-2" : undefined}
      >
        {options.multiline ? (
          <Textarea {...common} rows={2} onChange={(event) => update(field, event.target.value)} />
        ) : (
          <Input
            {...common}
            {...(options.autoComplete ? { autoComplete: options.autoComplete } : {})}
            {...(options.inputMode ? { inputMode: options.inputMode } : {})}
            onChange={(event) => update(field, event.target.value)}
          />
        )}
      </Field>
    );
  };

  const current = toInput(state);
  const preview = useImprintLines(current, workspace);
  // Hints only: a register may allow a spelling no pattern knows (concept chapter 8, E-053).
  const hints = designationHints(current, workspace);
  const missing =
    (business && (!form || !offeredForms.includes(form)) ? 1 : 0) +
    required.filter((field) => field in state && !String(state[field as keyof FormState]).trim())
      .length;

  return (
    <form
      method="post"
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
      aria-label={t("formLabel")}
    >
      {!canEdit ? <Alert tone="info">{t("readOnly")}</Alert> : null}
      <Card>
        <CardHeader
          icon={<Building aria-hidden="true" />}
          title={t("companyTitle")}
          description={business ? t("companyHint") : t("privateHint")}
          action={
            complete && missing === 0 ? (
              <Badge tone="success">
                <BadgeCheck aria-hidden="true" className="size-3.5" />
                {t("complete")}
              </Badge>
            ) : (
              <Badge tone="warning">{t("missing", { count: missing })}</Badge>
            )
          }
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {business ? (
            <Field
              id="sender-legalForm"
              label={t("fields.legalForm")}
              requiredMark={t("requiredMark")}
              hint={t("legalFormHint")}
              error={errorText("legalForm")}
              className="sm:col-span-2"
            >
              <Select
                id="sender-legalForm"
                aria-describedby={
                  fieldErrors.legalForm ? "sender-legalForm-error" : "sender-legalForm-hint"
                }
                value={state.legalForm}
                disabled={!canEdit}
                required
                invalid={Boolean(fieldErrors.legalForm)}
                onChange={(event) =>
                  update("legalForm", isLegalForm(event.target.value) ? event.target.value : "")
                }
              >
                <option value="">{t("legalFormChoose")}</option>
                {formOptions.map((value) => (
                  <option key={value} value={value}>
                    {t(`legalForms.${countryKey}.${value}`)}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {textField("companyName", {
            autoComplete: "organization",
            label: business ? t("fields.companyName") : t("fields.privateName"),
            ...(business
              ? {
                  hint: hints.includes("companyName") ? t("designationHint") : t("companyNameHint"),
                }
              : {}),
          })}
          {textField("street", { autoComplete: "street-address" })}
          {textField("postalCode", { autoComplete: "postal-code", inputMode: "numeric" })}
          {textField("city", { autoComplete: "address-level2" })}
          <Field id="sender-country" label={t("fields.country")} error={errorText("country")}>
            <Select
              id="sender-country"
              value={state.country}
              disabled={!canEdit}
              onChange={(event) => update("country", event.target.value)}
            >
              {countries.map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code}`)}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {business &&
      (shown("registerCourt") || shown("managingDirectors") || shown("supervisoryBoardChair")) ? (
        <Card>
          <CardHeader title={t("registerTitle")} description={t(`registerHint.${countryKey}`)} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            {textField("registerCourt", {
              label: t(`registerCourt.${registerKey}`),
              hint: t(`registerCourtHint.${registerKey}`),
            })}
            {textField("registerNumber", {
              label: t(`registerNumber.${registerKey}`),
              hint: t(`registerNumberHint.${numberHintKey}`),
            })}
            {textField("seat", { autoComplete: "off", hint: t("seatHint") })}
            {textField("generalPartnerName", {
              hint: hints.includes("generalPartnerName")
                ? t("generalPartnerDesignationHint")
                : t("generalPartnerHint"),
            })}
            {textField("generalPartnerSeat")}
            {textField("generalPartnerRegisterCourt", {
              label: t(`generalPartnerRegisterCourt.${countryKey}`),
              hint: t(`registerCourtHint.${countryKey}`),
            })}
            {textField("generalPartnerRegisterNumber", {
              label: t(`generalPartnerRegisterNumber.${countryKey}`),
              hint: t(`generalPartnerRegisterNumberHint.${countryKey}`),
            })}
            {textField("managingDirectors", {
              multiline: true,
              label: t(`directors.${role ?? "management"}`),
              hint: t("directorsHint"),
            })}
            {textField("supervisoryBoardChair", {
              ...(form === "gmbh_co_kg"
                ? { label: t("fields.generalPartnerSupervisoryBoardChair") }
                : {}),
              ...(isRequired("supervisoryBoardChair") ? {} : { hint: t("supervisoryBoardHint") }),
            })}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={t("contactTitle")} description={t("contactHint")} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {textField("vatId", { label: t(`vatId.${countryKey}`), hint: t("vatIdHint") })}
          {textField("phone", { autoComplete: "tel", inputMode: "tel" })}
          {textField("website", { autoComplete: "url", inputMode: "url" })}
          {textField("privacyUrl", { inputMode: "url", hint: t("privacyUrlHint") })}
        </CardBody>
      </Card>

      {!compact ? (
        <Card>
          <CardHeader
            icon={<Eye aria-hidden="true" />}
            title={t("previewTitle")}
            description={t("previewHint")}
          />
          <CardBody>
            <div className="rounded-md border border-dashed border-border-strong bg-surface-muted/60 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-text-muted">
              {preview.length > 0 ? (
                preview.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p>{t("previewEmpty")}</p>
              )}
            </div>
          </CardBody>
        </Card>
      ) : null}

      {save.error &&
      !(save.error.data as { appError?: { fields?: unknown } } | undefined)?.appError?.fields ? (
        <Alert tone="danger">{errorMessage(save.error)}</Alert>
      ) : null}
      {Object.keys(fieldErrors).length > 0 ? (
        <Alert tone="danger">{t("fixFields", { count: Object.keys(fieldErrors).length })}</Alert>
      ) : null}
      {canEdit ? (
        <div className="flex justify-end">
          <Button id="sender-save" type="submit" loading={save.isPending}>
            {compact ? t("saveAndContinue") : t("save")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
