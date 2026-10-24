import { Card, CardBody, CardHeader } from "@ep/ui";
import { MessagesSquare, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  NotFoundState,
  PlaceholderPage,
  placeholderMetadata,
} from "../../../../../components/placeholder-page";
import { requireAppContext } from "../../../../../server/app-context";
import { lookup } from "../../../../../server/lookup";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("inboxThread");
}

export default async function InboxThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  await requireAppContext({ path: `/posteingang/thread/${threadId}` });
  const t = await getTranslations("actions");
  const tThread = await getTranslations("threadDetail");
  const object = await lookup("thread", threadId);
  if (!object) return <NotFoundState backHref="/posteingang" backLabel={t("backToInbox")} />;
  return (
    <PlaceholderPage
      pageKey="inboxThread"
      icon={<MessagesSquare aria-hidden="true" />}
      title={object.title || t("untitled")}
      actions={[{ href: "/posteingang", label: t("backToInbox") }]}
      aside={
        <Card>
          <CardHeader
            icon={<UserRound aria-hidden="true" />}
            title={tThread("contactTitle")}
            headingLevel={2}
          />
          <CardBody>
            <p className="text-[13px] text-text-muted">{tThread("contactText")}</p>
          </CardBody>
        </Card>
      }
    />
  );
}
