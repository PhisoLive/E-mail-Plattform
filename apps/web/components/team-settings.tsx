"use client";

import type { MemberRole } from "@ep/core/context";
import { canManageRole } from "@ep/core/permissions";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  DialogClose,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  LoadingState,
  Select,
  toast,
} from "@ep/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ellipsis, MailPlus, ShieldAlert, UserMinus, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { type FormEvent, useRef, useState } from "react";
import { useTRPC } from "../lib/trpc";
import { useErrorMessage } from "../lib/use-error-message";

const roles: readonly MemberRole[] = ["owner", "admin", "member", "viewer"];

export function TeamSettings({
  currentUserId,
  actorRole,
  canManage,
  invitationDays,
}: {
  currentUserId: string;
  actorRole: MemberRole;
  canManage: boolean;
  invitationDays: number;
}) {
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const format = useFormatter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const members = useQuery(trpc.team.members.queryOptions());
  // Role from the same request as the list – both always belong to the same workspace.
  const myRole = members.data?.find((member) => member.userId === currentUserId)?.role ?? actorRole;
  const mayManage = members.data ? canManageRole(myRole, "viewer") : canManage;
  const invitations = useQuery({
    ...trpc.team.invitations.queryOptions(),
    enabled: mayManage,
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string; self: boolean } | null>(
    null,
  );

  const memberList = useRef<HTMLUListElement>(null);
  const refreshMembers = () =>
    queryClient.invalidateQueries({ queryKey: trpc.team.members.queryKey() });

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
  const changeRole = useMutation(
    trpc.team.changeRole.mutationOptions({
      onSuccess: async () => {
        toast.success(t("settings.team.roleChanged"));
        await refreshMembers();
        // After demoting oneself the menu button disappears with the rights.
        requestAnimationFrame(() => {
          if (!document.activeElement || document.activeElement === document.body) {
            memberList.current?.focus({ preventScroll: true });
          }
        });
      },
      onError: (error) => toast.error(errorMessage(error)),
    }),
  );
  const remove = useMutation(
    trpc.team.removeMember.mutationOptions({
      onSuccess: async () => {
        const self = removing?.self ?? false;
        setRemoving(null);
        if (self) {
          // Without membership the workspace is gone for this user: start over with a full load.
          window.location.assign("/start");
          return;
        }
        toast.success(t("settings.team.removed"));
        await refreshMembers();
        // The row and its menu are gone: keep the keyboard position in the list.
        requestAnimationFrame(() => memberList.current?.focus({ preventScroll: true }));
      },
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
        <CardHeader
          icon={<Users aria-hidden="true" />}
          title={t("settings.team.members")}
          description={
            members.data
              ? t("settings.team.memberCount", { count: members.data.length })
              : undefined
          }
        />
        <CardBody>
          {members.isPending ? <LoadingState label={t("common.loading")} lines={3} /> : null}
          {members.error ? (
            <ErrorState
              title={t("settings.team.loadError")}
              description={errorMessage(members.error)}
              action={
                <Button variant="secondary" size="sm" onClick={() => members.refetch()}>
                  {t("common.retry")}
                </Button>
              }
            />
          ) : null}
          {members.data ? (
            <ul
              ref={memberList}
              tabIndex={-1}
              aria-label={t("settings.team.members")}
              className="-my-1 divide-y divide-border rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            >
              {members.data.map((member) => {
                const self = member.userId === currentUserId;
                const manageable = mayManage && canManageRole(myRole, member.role);
                return (
                  <li key={member.id} className="flex items-center gap-3 py-3">
                    <Avatar name={member.name} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {member.name}
                        {self ? (
                          <span className="ml-2 font-normal text-text-muted">
                            ({t("settings.team.you")})
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate text-[13px] text-text-muted">{member.email}</span>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      {!member.twoFactorEnabled &&
                      (member.role === "owner" || member.role === "admin") ? (
                        <Badge tone="warning">
                          <ShieldAlert aria-hidden="true" className="size-3.5" />
                          {t("settings.team.twoFactorMissing")}
                        </Badge>
                      ) : null}
                      <Badge>{t(`roles.${member.role}`)}</Badge>
                      {manageable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton
                              size="sm"
                              label={t("settings.team.memberActions", { name: member.name })}
                            >
                              <Ellipsis aria-hidden="true" />
                            </IconButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{t("settings.team.changeRole")}</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                              value={member.role}
                              onValueChange={(next) => {
                                if (next !== member.role)
                                  changeRole.mutate({
                                    memberId: member.id,
                                    role: next as MemberRole,
                                  });
                              }}
                            >
                              {roles
                                .filter((option) => canManageRole(myRole, member.role, option))
                                .map((option) => (
                                  <DropdownMenuRadioItem key={option} value={option}>
                                    {t(`roles.${option}`)}
                                  </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              icon={<UserMinus aria-hidden="true" />}
                              className="text-danger"
                              onSelect={() => {
                                // A failed earlier attempt must not show up for this member.
                                remove.reset();
                                setRemoving({ id: member.id, name: member.name, self });
                              }}
                            >
                              {self ? t("settings.team.leave") : t("settings.team.remove")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      {mayManage ? (
        <Card>
          <CardHeader
            icon={<MailPlus aria-hidden="true" />}
            title={t("settings.team.inviteTitle")}
            description={t("settings.team.inviteHint", { days: invitationDays })}
          />
          <CardBody className="flex flex-col gap-4">
            {sentTo ? (
              <Alert tone="success">{t("settings.team.sent", { email: sentTo })}</Alert>
            ) : null}
            {invite.error ? <Alert tone="danger">{errorMessage(invite.error)}</Alert> : null}
            <form
              method="post"
              className="grid gap-4 sm:grid-cols-[1fr_11rem_auto] sm:items-end"
              onSubmit={onInvite}
            >
              <Field id="invite-email" label={t("settings.team.emailLabel")}>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field id="invite-role" label={t("settings.team.roleLabel")}>
                <Select
                  id="invite-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as MemberRole)}
                >
                  {(["admin", "member", "viewer", "owner"] as const)
                    .filter((value) => canManageRole(myRole, "member", value))
                    .map((value) => (
                      <option key={value} value={value}>
                        {t(`roles.${value}`)}
                      </option>
                    ))}
                </Select>
              </Field>
              <Button type="submit" loading={invite.isPending}>
                {t("settings.team.send")}
              </Button>
            </form>
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-sm font-medium">{t("settings.team.pending")}</h3>
              {invitations.isPending ? (
                <LoadingState label={t("common.loading")} lines={2} />
              ) : null}
              {invitations.error ? (
                <Alert tone="danger">{errorMessage(invitations.error)}</Alert>
              ) : null}
              {revoke.error ? <Alert tone="danger">{errorMessage(revoke.error)}</Alert> : null}
              {invitations.data && invitations.data.length === 0 ? (
                <EmptyState
                  className="py-6"
                  title={t("settings.team.pendingEmpty")}
                  description={t("settings.team.pendingEmptyHint")}
                />
              ) : null}
              {invitations.data && invitations.data.length > 0 ? (
                <ul aria-label={t("settings.team.pending")} className="divide-y divide-border">
                  {invitations.data.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                    >
                      <span className="min-w-0 break-all">
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

      <Dialog open={removing !== null} onOpenChange={(open) => (open ? null : setRemoving(null))}>
        {removing ? (
          <DialogContent
            title={
              removing.self
                ? t("settings.team.leaveTitle")
                : t("settings.team.removeTitle", { name: removing.name })
            }
            description={
              removing.self ? t("settings.team.leaveText") : t("settings.team.removeText")
            }
            closeLabel={t("common.close")}
          >
            {remove.error ? (
              <Alert tone="danger" className="mb-4">
                {errorMessage(remove.error)}
              </Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary">{t("common.cancel")}</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={remove.isPending}
                onClick={() => remove.mutate({ memberId: removing.id })}
              >
                {removing.self ? t("settings.team.leaveConfirm") : t("settings.team.removeConfirm")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
