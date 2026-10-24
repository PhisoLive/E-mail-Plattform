"use client";

import { Alert, Button } from "@ep/ui";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { errorCode, useTRPC } from "../lib/trpc";
import { selectWorkspace } from "../lib/workspace-store";

export function InvitationAccept({ token }: { token: string }) {
  const t = useTranslations();
  const trpc = useTRPC();
  const accept = useMutation(
    trpc.invitation.accept.mutationOptions({
      onSuccess: async ({ workspaceId }) => {
        await selectWorkspace(workspaceId);
        window.location.assign("/start");
      },
    }),
  );
  return (
    <div className="flex flex-col gap-3">
      {accept.error ? (
        <Alert tone="danger">{t(`errors.${errorCode(accept.error)}` as never)}</Alert>
      ) : null}
      <Button onClick={() => accept.mutate({ token })} loading={accept.isPending}>
        {t("auth.invitation.accept")}
      </Button>
    </div>
  );
}
