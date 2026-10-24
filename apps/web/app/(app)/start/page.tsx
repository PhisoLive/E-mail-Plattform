import { buttonClasses, Card, CardBody, CardHeader, EmptyState, PageHeader, Stat } from "@ep/ui";
import { CheckCheck, Inbox, Mailbox, Plus, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { OnboardingChecklist } from "../../../components/onboarding-checklist";
import { requireAppContext } from "../../../server/app-context";
import { activeCaller } from "../../../server/workspace-caller";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("start");
  return { title: t("title") };
}

const kpis = ["delivered", "replies", "positive", "approvals", "inboxRate"] as const;

/** Start page (concept chapter 13): what is done and what waits for you. */
export default async function StartPage() {
  const t = await getTranslations("start");
  const format = await getFormatter();
  const { session } = await requireAppContext({ path: "/start" });
  const onboarding = await (await activeCaller()).workspace.onboarding();
  const firstName = session.name.split(" ")[0] ?? "";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={format.dateTime(new Date(), { weekday: "long", day: "numeric", month: "long" })}
        title={t("greeting", { name: firstName })}
        description={t("subtitle")}
        actions={
          <Link href="/auftraege/neu" className={buttonClasses()}>
            <Plus aria-hidden="true" />
            {t("newCampaign")}
          </Link>
        }
      />

      {onboarding.done < onboarding.total ? <OnboardingChecklist status={onboarding} /> : null}

      <section aria-labelledby="kpi-heading" className="flex flex-col gap-3">
        <h2 id="kpi-heading" className="sr-only">
          {t("kpiTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <Stat
              key={kpi}
              label={t(`kpis.${kpi}.label`)}
              value={t("kpiEmpty")}
              hint={t(`kpis.${kpi}.hint`)}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<CheckCheck aria-hidden="true" />} title={t("doneToday")} />
          <CardBody>
            <EmptyState
              className="py-8"
              title={t("doneTodayEmptyTitle")}
              description={t("doneTodayEmpty")}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<Inbox aria-hidden="true" />} title={t("waiting")} />
          <CardBody>
            <EmptyState
              className="py-8"
              title={t("waitingEmptyTitle")}
              description={t("waitingEmpty")}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader icon={<Send aria-hidden="true" />} title={t("running")} />
          <CardBody>
            <EmptyState
              className="py-8"
              title={t("runningEmptyTitle")}
              description={t("runningEmpty")}
              action={
                <Link
                  href="/auftraege/neu"
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  {t("newCampaign")}
                </Link>
              }
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<Mailbox aria-hidden="true" />} title={t("mailboxes")} />
          <CardBody>
            <EmptyState
              className="py-8"
              title={t("mailboxesEmptyTitle")}
              description={t("mailboxesEmpty")}
              action={
                <Link
                  href="/postfaecher/verbinden"
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  {t("connectMailbox")}
                </Link>
              }
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
