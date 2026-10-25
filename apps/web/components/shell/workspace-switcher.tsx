"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ep/ui";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { selectWorkspace } from "../../lib/workspace-store";
import type { ShellWorkspace } from "./types";

export function WorkspaceSwitcher({
  active,
  workspaces,
  collapsed,
}: {
  active: ShellWorkspace | null;
  workspaces: ShellWorkspace[];
  collapsed: boolean;
}) {
  const t = useTranslations("shell");
  const tRoles = useTranslations("roles");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={collapsed ? t("switchWorkspace") : undefined}
        className="flex w-full min-w-0 items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-[13px] font-semibold text-accent-text"
        >
          {(active?.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        {collapsed ? null : (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium text-text">
                {active?.name ?? t("noWorkspace")}
              </span>
              {active ? (
                <span className="truncate text-xs text-text-subtle">{tRoles(active.role)}</span>
              ) : null}
            </span>
            <span className="sr-only">, {t("switchWorkspace")}</span>
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-text-subtle" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel>{t("workspaces")}</DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={async () => {
              if (workspace.id === active?.id) return;
              if (await selectWorkspace(workspace.id)) window.location.assign("/start");
            }}
          >
            <span className="flex-1 truncate">{workspace.name}</span>
            {workspace.id === active?.id ? (
              <Check aria-label={t("activeWorkspace")} className="size-4 text-accent" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<Plus aria-hidden="true" />}
          onSelect={() => window.location.assign("/willkommen?neu=1")}
        >
          {t("newWorkspace")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
