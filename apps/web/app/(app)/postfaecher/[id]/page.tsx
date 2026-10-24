import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DetailTabs } from "../../../../components/detail-tabs";
import { NotFoundState } from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";
import { lookup } from "../../../../server/lookup";

const tabs = ["health", "setup", "limits", "ramp", "signature"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mailboxDetail");
  return { title: t("title") };
}

export default async function MailboxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAppContext({ path: `/postfaecher/${id}` });
  const t = await getTranslations("mailboxDetail");
  const tActions = await getTranslations("actions");
  const tStatus = await getTranslations("status.mailbox");
  const tCommon = await getTranslations("common");
  const mailbox = await lookup("mailbox", id);
  if (!mailbox)
    return <NotFoundState backHref="/postfaecher" backLabel={tActions("backToMailboxes")} />;
  return (
    <DetailTabs
      eyebrow={t("title")}
      title={mailbox.title}
      status={mailbox.status ? tStatus(mailbox.status as never) : undefined}
      description={t("description")}
      actions={[{ href: "/postfaecher", label: tActions("backToMailboxes") }]}
      label={t("tabsLabel")}
      soon={tCommon("soon")}
      tabs={tabs.map((tab) => ({
        value: tab,
        label: t(`tabs.${tab}`),
        title: t(`empty.${tab}.title`),
        text: t(`empty.${tab}.text`),
      }))}
    />
  );
}
