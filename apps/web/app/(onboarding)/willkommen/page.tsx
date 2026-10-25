import { buttonClasses, Card, CardBody } from "@ep/ui";
import { Mailbox, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { BrandMark } from "../../../components/brand-mark";
import { CreateWorkspaceForm } from "../../../components/create-workspace-form";
import { OnboardingProgress } from "../../../components/onboarding/onboarding-progress";
import { OnboardingAgent, OnboardingSender } from "../../../components/onboarding/onboarding-steps";
import { nextStepHref, onboardingFlow, stepBySlug } from "../../../components/onboarding/steps";
import { requireAppContext } from "../../../server/app-context";
import { activeCaller } from "../../../server/workspace-caller";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding.flow");
  return { title: t("title") };
}

function Frame({
  later,
  laterLabel,
  appName,
  children,
}: {
  later: boolean;
  laterLabel: string;
  appName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <BrandMark />
          {appName}
        </span>
        {later ? (
          <Link href="/start" className={buttonClasses({ variant: "ghost", size: "sm" })}>
            {laterLabel}
          </Link>
        ) : null}
      </header>
      {children}
    </div>
  );
}

/** Onboarding (concept chapter 13): workspace, mailbox, sender profile, first agent, first campaign. */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ schritt?: string; neu?: string }>;
}) {
  const { schritt, neu } = await searchParams;
  const context = await requireAppContext({
    path: "/willkommen",
    allowWithoutWorkspace: true,
    allowWithoutTwoFactor: true,
  });
  const t = await getTranslations("onboarding.flow");
  const tApp = await getTranslations("app");
  const frame = (children: ReactNode) => (
    <Frame later={Boolean(context.active)} laterLabel={t("later")} appName={tApp("name")}>
      {children}
    </Frame>
  );

  // Owners and admins secure their account first (concept chapter 16) – also before they create
  // another workspace; the layout checks the same for full page loads.
  if (context.active && context.needsTwoFactor) redirect("/einstellungen/profil");
  if (!context.active || neu === "1") {
    return frame(
      <>
        <OnboardingProgress
          current="workspace"
          done={{
            workspace: false,
            mailbox: false,
            senderProfile: false,
            agent: false,
            campaign: false,
          }}
        />
        <CreateWorkspaceForm />
      </>,
    );
  }
  const status = await (await activeCaller()).workspace.onboarding();
  const step =
    stepBySlug(schritt) ??
    onboardingFlow.find((entry) => !status.steps[entry.key]) ??
    onboardingFlow[0];
  const next = nextStepHref(step.slug);
  const heading = (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{t(`${step.key}.title`)}</h1>
      <p className="text-sm text-text-muted">{t(`${step.key}.text`)}</p>
    </div>
  );
  const skip = (
    <Link href={next} className={buttonClasses({ variant: "ghost" })}>
      {t("skip")}
    </Link>
  );

  let body: ReactNode;
  switch (step.key) {
    case "mailbox":
      body = (
        <Card>
          <CardBody className="flex flex-col gap-4 pt-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                <Mailbox aria-hidden="true" className="size-5" />
              </span>
              <p className="text-sm text-text-muted">{t("mailbox.detail")}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {skip}
              <Link href="/postfaecher/verbinden" className={buttonClasses()}>
                {t("mailbox.action")}
              </Link>
            </div>
          </CardBody>
        </Card>
      );
      break;
    case "senderProfile":
      body = (
        <div className="flex flex-col gap-3">
          <OnboardingSender next={next} />
          <div className="flex justify-end">{skip}</div>
        </div>
      );
      break;
    case "agent":
      body = (
        <div className="flex flex-col gap-3">
          <OnboardingAgent next={next} />
          <div className="flex justify-end">{skip}</div>
        </div>
      );
      break;
    case "campaign":
      body = (
        <Card>
          <CardBody className="flex flex-col gap-4 pt-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                <PartyPopper aria-hidden="true" className="size-5" />
              </span>
              <p className="text-sm text-text-muted">{t("campaign.detail")}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Link href="/start" className={buttonClasses({ variant: "ghost" })}>
                {t("finish")}
              </Link>
              <Link href="/auftraege/neu?vorlage=summerParty" className={buttonClasses()}>
                {t("campaign.action")}
              </Link>
            </div>
          </CardBody>
        </Card>
      );
      break;
  }

  return frame(
    <>
      <OnboardingProgress current={step.key} done={status.steps} />
      {heading}
      {body}
    </>,
  );
}
