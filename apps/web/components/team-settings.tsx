"use client";

import { Alert, Button, Card, CardBody, CardHeader, Field, Input } from "@ep/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { errorCode, useTRPC } from "../lib/trpc";

const selectClass =
  "h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus";

type Role = "owner" | "admin" | "member" | "viewer";

export function TeamSettings({
  currentUserId,
  canManage,
}: {
  currentUserId: string;
  canManage: boolean;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const members = useQuery(trpc.team.members.queryOptions());
  const invitations = useQuery({ ...trpc.team.invitations.queryOptions(), enabled: canManage });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [sentTo, setSentTo] = useState<string | null>(null);

  const invite = useMutation(
    trpc.team.invite.mutationOptions({
      onSuccess: async (created) => {
        setSentTo(created.email);
        setEmail("");
        await queryClient.invalidateQueries({ queryKey: trpc.team.invitations.queryKey() });
      },
    }),
  );
  const revoke = useMutation(
    trpc.team.revokeInvitation.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: trpc.team.invitations.queryKey() }),
    }),
  );

  function onInvite(event: FormEvent) {
    event.preventDefault();
    setSentTo(null);
    invite.mutate({ email, role });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader title={t("settings.team.members")} />
        <CardBody>
          {members.isPending ? (
            <p className="text-sm text-text-muted">{t("common.loading")}</p>
          ) : null}
          {members.error ? (
            <Alert tone="danger">{t(`errors.${errorCode(members.error)}`)}</Alert>
          ) : null}
          {members.data ? (
            <ul aria-label={t("settings.team.members")} className="divide-y divide-border">
              {members.data.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {member.name}
                      {member.userId === currentUserId ? (
                        <span className="ml-2 text-text-muted">({t("settings.team.you")})</span>
                      ) : null}
                    </span>
                    <span className="text-text-muted">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!member.twoFactorEnabled &&
                    (member.role === "owner" || member.role === "admin") ? (
                      <span className="rounded-sm bg-warning-soft px-2 py-0.5 text-xs">
                        {t("settings.team.twoFactorMissing")}
                      </span>
                    ) : null}
                    <span className="rounded-sm bg-surface-muted px-2 py-0.5 text-xs">
                      {t(`roles.${member.role}`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader title={t("settings.team.inviteTitle")} />
          <CardBody className="flex flex-col gap-4">
            {sentTo ? (
              <Alert tone="success">{t("settings.team.sent", { email: sentTo })}</Alert>
            ) : null}
            {invite.error ? (
              <Alert tone="danger">{t(`errors.${errorCode(invite.error)}`)}</Alert>
            ) : null}
            <form
              className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
              onSubmit={onInvite}
            >
              <Field id="invite-email" label={t("settings.team.emailLabel")}>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field id="invite-role" label={t("settings.team.roleLabel")}>
                <select
                  id="invite-role"
                  className={selectClass}
                  value={role}
                  onChange={(event) => setRole(event.target.value as Role)}
                >
                  {(["admin", "member", "viewer", "owner"] as const).map((value) => (
                    <option key={value} value={value}>
                      {t(`roles.${value}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="submit" loading={invite.isPending}>
                {t("settings.team.send")}
              </Button>
            </form>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{t("settings.team.pending")}</h3>
              {invitations.isPending ? (
                <p className="text-sm text-text-muted">{t("common.loading")}</p>
              ) : null}
              {invitations.error ? (
                <Alert tone="danger">{t(`errors.${errorCode(invitations.error)}`)}</Alert>
              ) : null}
              {revoke.error ? (
                <Alert tone="danger">{t(`errors.${errorCode(revoke.error)}`)}</Alert>
              ) : null}
              {invitations.data && invitations.data.length === 0 ? (
                <p className="text-sm text-text-muted">{t("settings.team.pendingEmpty")}</p>
              ) : null}
              {invitations.data && invitations.data.length > 0 ? (
                <ul aria-label={t("settings.team.pending")} className="divide-y divide-border">
                  {invitations.data.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                    >
                      <span>
                        {invitation.email} · {t(`roles.${invitation.role}`)}{" "}
                        <span className="text-text-muted">
                          {t("settings.team.expires", {
                            date: format.dateTime(invitation.expiresAt, { dateStyle: "medium" }),
                          })}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={
                          revoke.isPending && revoke.variables?.invitationId === invitation.id
                        }
                        onClick={() => revoke.mutate({ invitationId: invitation.id })}
                      >
                        {t("settings.team.revoke")}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
