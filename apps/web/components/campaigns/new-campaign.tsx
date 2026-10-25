"use client";

import { defaults } from "@ep/config/defaults";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  cn,
  SuggestOrWrite,
} from "@ep/ui";
import { Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type TemplateKey, templateKeys } from "../../lib/templates";

const steps = ["recipients", "message", "details", "check", "send"] as const;
const tones = ["friendly", "factual", "casual", "formal"] as const;

/** Start of the click assistant: the goal in your own words, then the five steps (chapter 9). */
export function NewCampaign({
  template,
  defaultFormality,
}: {
  template: TemplateKey | null;
  /** Default of the workspace (concept chapter 7: contact, then agent, then workspace). */
  defaultFormality: "sie" | "du" | "auto";
}) {
  const t = useTranslations("newCampaign");
  const tTemplates = useTranslations("templates.items");
  const [goal, setGoal] = useState(template ? tTemplates(`${template}.goal`) : "");
  const [tone, setTone] = useState(t("tones.friendly"));
  const [formality, setFormality] = useState(t(`formality.${defaultFormality}`));
  const [showNext, setShowNext] = useState(false);
  const tooShort = goal.trim().length < defaults.campaign.goalMinLength;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <Card>
        <CardHeader
          icon={<Target aria-hidden="true" />}
          title={t("goalTitle")}
          description={t("goalHint")}
          action={template ? <Badge tone="accent">{tTemplates(`${template}.name`)}</Badge> : null}
        />
        <CardBody className="flex flex-col gap-6">
          <SuggestOrWrite
            id="campaign-goal"
            label={t("goalLabel")}
            multiline
            value={goal}
            onChange={(value) => setGoal(value)}
            suggestions={templateKeys.slice(0, 4).map((key) => ({
              id: key,
              label: tTemplates(`${key}.short`),
              value: tTemplates(`${key}.goal`),
            }))}
            suggestionsLabel={t("suggestions")}
            placeholder={t("goalPlaceholder")}
            hint={t("aiHint")}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <SuggestOrWrite
              id="campaign-tone"
              label={t("toneLabel")}
              value={tone}
              onChange={(value) => setTone(value)}
              suggestions={tones.map((key) => ({ id: key, label: t(`tones.${key}`) }))}
              suggestionsLabel={t("suggestions")}
              placeholder={t("tonePlaceholder")}
            />
            <SuggestOrWrite
              id="campaign-formality"
              label={t("formalityLabel")}
              allowFreeText={false}
              value={formality}
              onChange={(value) => setFormality(value)}
              suggestions={[
                { id: "sie", label: t("formality.sie") },
                { id: "du", label: t("formality.du") },
                { id: "auto", label: t("formality.auto") },
              ]}
              suggestionsLabel={t("formalityLabel")}
              explain={t("formalityExplain")}
            />
          </div>
          {showNext ? <Alert tone="info">{t("nextSoon")}</Alert> : null}
        </CardBody>
        <CardFooter>
          {tooShort ? (
            <p id="campaign-goal-short" className="mr-auto text-xs text-text-muted">
              {t("goalTooShort")}
            </p>
          ) : null}
          <Button
            disabled={tooShort}
            aria-describedby={tooShort ? "campaign-goal-short" : undefined}
            onClick={() => setShowNext(true)}
          >
            {t("continue")}
          </Button>
        </CardFooter>
      </Card>

      <nav aria-label={t("stepsLabel")} className="lg:pt-1">
        <h2 className="px-1 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-subtle">
          {t("stepsTitle")}
        </h2>
        <ol className="flex flex-col gap-1">
          {steps.map((step, index) => (
            <li
              key={step}
              className={cn(
                "flex items-start gap-3 rounded-md px-3 py-2",
                index === 0 ? "bg-surface shadow-sm ring-1 ring-border" : "",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  index === 0
                    ? "bg-accent text-accent-text"
                    : "border border-border-strong text-text-muted",
                )}
              >
                {index + 1}
              </span>
              <span className="flex flex-col">
                <span className="text-[13.5px] font-medium text-text">
                  {t(`steps.${step}.title`)}
                </span>
                <span className="text-xs text-text-muted">{t(`steps.${step}.text`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
