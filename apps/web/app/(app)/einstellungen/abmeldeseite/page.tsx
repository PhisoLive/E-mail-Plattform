import { Badge, buttonClasses, Card, CardBody, CardHeader, PageHeader } from "@ep/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { UnsubscribeCard } from "../../../../components/public/unsubscribe-card";
import { requireAppContext } from "../../../../server/app-context";
import { activeCaller } from "../../../../server/workspace-caller";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("unsubscribeSettings");
  return { title: t("title") };
}

/** Preview of the public unsubscribe page with the sender details (concept chapter 13). */
export default async function UnsubscribeSettingsPage() {
  await requireAppContext({ path: "/einstellungen/abmeldeseite" });
  const t = await getTranslations("unsubscribeSettings");
  const tPage = await getTranslations("unsubscribe");
  const tCommon = await getTranslations("common");
  const { profile, complete } = await (await activeCaller()).senderProfile.get();
  const place = [profile.address.postalCode, profile.address.city].filter(Boolean).join(" ");
  const senderLines = [
    profile.companyName,
    [profile.address.street, place].filter(Boolean).join(", "),
    [profile.registerCourt, profile.registerNumber].filter(Boolean).join(", "),
    profile.managingDirectors,
  ].filter((line): line is string => Boolean(line));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <Card>
        <CardHeader
          title={t("previewTitle")}
          description={complete ? t("previewHint") : t("incomplete")}
          action={
            complete ? null : (
              <Link href="/einstellungen/absender" className={buttonClasses({ size: "sm" })}>
                {t("completeProfile")}
              </Link>
            )
          }
        />
        <CardBody>
          <div className="flex justify-center rounded-lg bg-bg px-3 py-8 sm:px-8">
            <UnsubscribeCard
              disabled
              senderLines={senderLines}
              texts={{
                title: tPage("title"),
                text: tPage("text"),
                confirm: tPage("confirm"),
                senderLabel: tPage("sender"),
              }}
            />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title={t("optionsTitle")}
          description={t("optionsText")}
          action={<Badge tone="info">{tCommon("soon")}</Badge>}
        />
      </Card>
    </div>
  );
}
