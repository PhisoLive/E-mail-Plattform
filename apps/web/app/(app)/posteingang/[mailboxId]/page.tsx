import { Mailbox } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  NotFoundState,
  PlaceholderPage,
  placeholderMetadata,
} from "../../../../components/placeholder-page";
import { requireAppContext } from "../../../../server/app-context";
import { lookup } from "../../../../server/lookup";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("inboxMailbox");
}

export default async function InboxMailboxPage({
  params,
}: {
  params: Promise<{ mailboxId: string }>;
}) {
  const { mailboxId } = await params;
  await requireAppContext({ path: `/posteingang/${mailboxId}` });
  const t = await getTranslations("actions");
  const object = await lookup("mailbox", mailboxId);
  if (!object) return <NotFoundState backHref="/posteingang" backLabel={t("backToInbox")} />;
  return (
    <PlaceholderPage
      pageKey="inboxMailbox"
      icon={<Mailbox aria-hidden="true" />}
      title={object.title || t("untitled")}
      actions={[{ href: "/posteingang", label: t("backToInbox") }]}
    />
  );
}
