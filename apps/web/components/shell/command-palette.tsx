"use client";

import { CommandDialog, CommandGroup, CommandItem } from "@ep/ui";
import {
  ArrowRightLeft,
  Bot,
  CornerDownLeft,
  FileUp,
  Mailbox,
  Monitor,
  Moon,
  Plus,
  Sun,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "../../lib/use-theme";
import { selectWorkspace } from "../../lib/workspace-store";
import { adminNav, agentsNav, mainNav, settingsNav } from "./nav";
import type { ShellUser, ShellWorkspace } from "./types";

export function CommandPalette({
  open,
  onOpenChange,
  user,
  workspaces,
  active,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ShellUser;
  workspaces: ShellWorkspace[];
  active: ShellWorkspace | null;
  returnFocus?: () => HTMLElement | null;
}) {
  const t = useTranslations("shell.palette");
  const tNav = useTranslations("nav");
  const tSettings = useTranslations("settingsNav");
  const router = useRouter();
  const [, setTheme] = useTheme();

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const actions = [
    { key: "newCampaign", href: "/auftraege/neu", icon: Plus },
    { key: "connectMailbox", href: "/postfaecher/verbinden", icon: Mailbox },
    { key: "importContacts", href: "/kontakte/import", icon: FileUp },
    { key: "newAgent", href: "/agenten/neu", icon: Bot },
    { key: "invite", href: "/einstellungen/team", icon: UserPlus },
  ] as const;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      placeholder={t("placeholder")}
      emptyText={t("empty")}
      {...(returnFocus ? { returnFocus } : {})}
    >
      <CommandGroup heading={t("actions")}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <CommandItem
              key={action.key}
              value={`action-${action.key}`}
              keywords={[t(`action.${action.key}`)]}
              icon={<Icon aria-hidden="true" />}
              onSelect={() => go(action.href)}
            >
              {t(`action.${action.key}`)}
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandGroup heading={t("jump")}>
        {[
          ...[...mainNav, agentsNav].map((item) => ({ ...item, label: tNav(item.key) })),
          ...(user.adminLabel ? [{ ...adminNav, label: user.adminLabel }] : []),
        ].map((item) => {
          const Icon = item.icon;
          return (
            <CommandItem
              key={item.key}
              value={`nav-${item.key}`}
              keywords={[item.label]}
              icon={<Icon aria-hidden="true" />}
              hint={<CornerDownLeft aria-hidden="true" className="size-3.5" />}
              onSelect={() => go(item.href)}
            >
              {item.label}
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandGroup heading={t("settings")}>
        {settingsNav.map((item) => (
          <CommandItem
            key={item.key}
            value={`settings-${item.key}`}
            keywords={[tSettings(item.key), tNav("settings")]}
            onSelect={() => go(item.href)}
          >
            {tSettings(item.key)}
          </CommandItem>
        ))}
      </CommandGroup>
      {workspaces.length > 1 ? (
        <CommandGroup heading={t("workspaces")}>
          {workspaces
            .filter((workspace) => workspace.id !== active?.id)
            .map((workspace) => (
              <CommandItem
                key={workspace.id}
                value={`workspace-${workspace.id}`}
                keywords={[workspace.name]}
                icon={<ArrowRightLeft aria-hidden="true" />}
                onSelect={async () => {
                  onOpenChange(false);
                  if (await selectWorkspace(workspace.id)) window.location.assign("/start");
                }}
              >
                {t("switchTo", { name: workspace.name })}
              </CommandItem>
            ))}
        </CommandGroup>
      ) : null}
      <CommandGroup heading={t("theme")}>
        <CommandItem
          value="theme-light"
          keywords={[t("themeLight")]}
          icon={<Sun aria-hidden="true" />}
          onSelect={() => {
            setTheme("light");
            onOpenChange(false);
          }}
        >
          {t("themeLight")}
        </CommandItem>
        <CommandItem
          value="theme-dark"
          keywords={[t("themeDark")]}
          icon={<Moon aria-hidden="true" />}
          onSelect={() => {
            setTheme("dark");
            onOpenChange(false);
          }}
        >
          {t("themeDark")}
        </CommandItem>
        <CommandItem
          value="theme-system"
          keywords={[t("themeSystem")]}
          icon={<Monitor aria-hidden="true" />}
          onSelect={() => {
            setTheme("system");
            onOpenChange(false);
          }}
        >
          {t("themeSystem")}
        </CommandItem>
      </CommandGroup>
    </CommandDialog>
  );
}
