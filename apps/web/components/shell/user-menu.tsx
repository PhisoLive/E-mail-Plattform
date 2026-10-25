"use client";

import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ep/ui";
import { CircleQuestionMark, Keyboard, LogOut, Settings, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "../../lib/auth-client";
import type { ThemePreference } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";
import type { ShellUser } from "./types";

export function UserMenu({
  user,
  collapsed,
  onOpenCommands,
  onOpenHelp,
}: {
  user: ShellUser;
  collapsed: boolean;
  onOpenCommands: () => void;
  onOpenHelp: () => void;
}) {
  const t = useTranslations("shell");
  const [theme, setTheme] = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={collapsed ? t("userMenu") : undefined}
        className="flex w-full min-w-0 items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Avatar name={user.name} />
        {collapsed ? null : (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium text-text">{user.name}</span>
            <span className="truncate text-xs text-text-subtle">{user.email}</span>
            <span className="sr-only">, {t("userMenu")}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuItem
          icon={<UserRound aria-hidden="true" />}
          onSelect={() => window.location.assign("/einstellungen/profil")}
        >
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<Settings aria-hidden="true" />}
          onSelect={() => window.location.assign("/einstellungen/team")}
        >
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ThemePreference)}
        >
          <DropdownMenuRadioItem value="light">{t("theme.light")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t("theme.dark")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t("theme.system")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Keyboard aria-hidden="true" />} onSelect={onOpenCommands}>
          {t("commands")}
        </DropdownMenuItem>
        <DropdownMenuItem icon={<CircleQuestionMark aria-hidden="true" />} onSelect={onOpenHelp}>
          {t("help")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<LogOut aria-hidden="true" />}
          onSelect={async () => {
            await authClient.signOut();
            window.location.assign("/login");
          }}
        >
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
