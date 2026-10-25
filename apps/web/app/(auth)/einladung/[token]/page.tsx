import { Alert, Card, CardBody } from "@ep/ui";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InvitationAccept } from "../../../../components/invitation-accept";
import { serverCaller } from "../../../../server/caller";
import { currentSession } from "../../../../server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.invitation");
  return { title: t("accept") };
}

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations();
  const caller = await serverCaller();
  // Unknown, revoked or malformed tokens get a clear answer; other errors reach the error page.
  const preview = await caller.invitation.preview({ token }).catch((error: unknown) => {
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST"))
      return null;
    throw error;
  });
  if (!preview) {
    return (
      <Card>
        <CardBody className="flex flex-col gap-4 py-6">
          <h1 className="text-xl font-semibold tracking-tight">
            {t("auth.invitation.invalidTitle")}
          </h1>
          <p className="text-sm text-text-muted">{t("auth.invitation.invalid")}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="font-medium text-accent hover:underline" href="/login">
              {t("auth.login.submit")}
            </Link>
            <Link className="font-medium text-accent hover:underline" href="/">
              {t("pages.notFound.back")}
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }
  const session = await currentSession();
  const next = `/einladung/${token}`;
  return (
    <Card>
      <CardBody className="flex flex-col gap-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("auth.invitation.title", { workspace: preview.workspaceName })}
        </h1>
        <p className="text-sm text-text-muted">
          {t("auth.invitation.text", { role: t(`roles.${preview.role}`), email: preview.email })}
        </p>
        {preview.state === "expired" ? (
          <Alert tone="warning">{t("auth.invitation.expired")}</Alert>
        ) : null}
        {preview.state === "used" ? <Alert tone="info">{t("auth.invitation.used")}</Alert> : null}
        {preview.state === "valid" && session ? <InvitationAccept token={token} /> : null}
        {preview.state === "valid" && !session ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>{t("auth.invitation.loginFirst", { email: preview.email })}</p>
            <div className="flex gap-3">
              <Link
                className="font-medium text-accent hover:underline"
                href={`/login?next=${encodeURIComponent(next)}`}
              >
                {t("auth.login.submit")}
              </Link>
              <Link
                className="font-medium text-accent hover:underline"
                href={`/registrieren?next=${encodeURIComponent(next)}`}
              >
                {t("auth.login.toRegister")}
              </Link>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
