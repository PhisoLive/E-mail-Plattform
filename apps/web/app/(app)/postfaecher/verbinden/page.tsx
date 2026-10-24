import { PageHeader } from "@ep/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProviderPicker } from "../../../../components/mailboxes/provider-picker";
import { requireAppContext } from "../../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connectMailbox");
  return { title: t("title") };
}

export default async function ConnectMailboxPage() {
  await requireAppContext({ path: "/postfaecher/verbinden" });
  const t = await getTranslations("connectMailbox");
  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} description={t("description")} />
      <ProviderPicker />
    </div>
  );
}
