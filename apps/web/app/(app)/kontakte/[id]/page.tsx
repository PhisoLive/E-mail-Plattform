import { UserRound } from "lucide-react";
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
  return placeholderMetadata("contactDetail");
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAppContext({ path: `/kontakte/${id}` });
  const t = await getTranslations("actions");
  const object = await lookup("contact", id);
  if (!object) return <NotFoundState backHref="/kontakte" backLabel={t("backToContacts")} />;
  return (
    <PlaceholderPage
      pageKey="contactDetail"
      icon={<UserRound aria-hidden="true" />}
      title={object.title || t("untitled")}
      actions={[{ href: "/kontakte", label: t("backToContacts") }]}
    />
  );
}
