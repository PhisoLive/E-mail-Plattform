import { Card, CardBody, CardHeader } from "@ep/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAppContext } from "../../../server/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("start");
  return { title: t("title") };
}

export default async function StartPage() {
  const t = await getTranslations("start");
  const { session } = await requireAppContext({ path: "/start" });
  const firstName = session.name.split(" ")[0] ?? "";
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("greeting", { name: firstName })}
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title={t("doneToday")} />
          <CardBody>
            <p className="text-sm text-text-muted">{t("doneTodayEmpty")}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("waiting")} />
          <CardBody>
            <p className="text-sm text-text-muted">{t("waitingEmpty")}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
