"use client";

import { Avatar, buttonClasses, cn, IconButton, Kbd, Tooltip } from "@ep/ui";
import { CircleQuestionMark, PanelLeftClose, PanelLeftOpen, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { adminNav, agentsNav, isActive, mainNav, type NavItem, settingsLink } from "./nav";
import type { ShellAgent, ShellUser, ShellWorkspace } from "./types";
import { useModifierKey } from "./use-modifier-key";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

export interface SidebarProps {
  user: ShellUser;
  workspaces: ShellWorkspace[];
  active: ShellWorkspace | null;
  /** Threads waiting for the user (badge); hidden when 0. */
  inboxCount?: number;
  agents: ShellAgent[];
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onOpenCommands: () => void;
  onOpenHelp: () => void;
  /** Called after a link was followed (closes the mobile drawer). */
  onNavigate?: () => void;
}

function NavLink({
  item,
  label,
  collapsed,
  active,
  trailing,
  onNavigate,
}: {
  item: NavItem;
  label: string;
  collapsed: boolean;
  active: boolean;
  trailing?: ReactNode;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "group flex h-9 min-w-0 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
        collapsed && "justify-center px-0",
        active
          ? "bg-surface font-medium text-text shadow-sm ring-1 ring-border"
          : "text-text-muted hover:bg-surface-hover hover:text-text",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-[18px] shrink-0",
          active ? "text-accent" : "text-text-subtle group-hover:text-text-muted",
        )}
      />
      {collapsed ? null : <span className="min-w-0 flex-1 truncate">{label}</span>}
      {collapsed ? null : trailing}
    </Link>
  );
  return collapsed ? (
    <Tooltip content={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

export function Sidebar({
  user,
  workspaces,
  active,
  inboxCount = 0,
  agents,
  collapsed,
  onToggleCollapsed,
  onOpenCommands,
  onOpenHelp,
  onNavigate,
}: SidebarProps) {
  const t = useTranslations("shell");
  const tNav = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();
  const modifier = useModifierKey();
  const newCampaign = t("newCampaign");
  const search = t("search");

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 px-3 pt-3 pb-3">
      <div className={cn("flex h-9 items-center gap-2 px-1", collapsed && "justify-center px-0")}>
        {collapsed ? null : (
          <Link
            href="/start"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-focus"
          >
            <BrandMark />
            <span className="truncate">{tApp("name")}</span>
          </Link>
        )}
        {onToggleCollapsed ? (
          <IconButton
            size="sm"
            label={collapsed ? t("expand") : t("collapse")}
            aria-expanded={!collapsed}
            onClick={onToggleCollapsed}
            className="text-text-subtle"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </IconButton>
        ) : null}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {collapsed ? (
          <Tooltip content={newCampaign} side="right">
            <Link
              href="/auftraege/neu"
              aria-label={newCampaign}
              onClick={onNavigate}
              className={buttonClasses({ className: "size-9 px-0" })}
            >
              <Plus aria-hidden="true" />
            </Link>
          </Tooltip>
        ) : (
          <Link
            href="/auftraege/neu"
            onClick={onNavigate}
            className={buttonClasses({ className: "w-full justify-start" })}
          >
            <Plus aria-hidden="true" />
            {newCampaign}
          </Link>
        )}
        {collapsed ? (
          <Tooltip content={search} side="right">
            <button
              type="button"
              aria-label={search}
              onClick={onOpenCommands}
              className={buttonClasses({
                variant: "ghost",
                className: "size-9 px-0 text-text-muted",
              })}
            >
              <Search aria-hidden="true" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={onOpenCommands}
            className="flex h-9 items-center gap-2.5 rounded-md border border-border bg-surface px-2.5 text-left text-[13px] text-text-subtle shadow-sm transition-colors hover:border-border-strong hover:text-text-muted focus-visible:outline-2 focus-visible:outline-focus"
          >
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="flex-1 truncate">{search}</span>
            <span className="flex items-center gap-0.5" aria-hidden="true">
              <Kbd>{modifier}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        )}
      </div>

      <nav aria-label={tNav("main")} className="mt-3 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-0.5">
            {mainNav.map((item) => (
              <li key={item.key}>
                <NavLink
                  item={item}
                  label={tNav(item.key)}
                  collapsed={collapsed}
                  active={isActive(pathname, item.href)}
                  onNavigate={onNavigate}
                  trailing={
                    item.key === "inbox" && inboxCount > 0 ? (
                      <span className="tabular rounded-full bg-accent-soft px-1.5 text-[11px] font-medium text-accent-strong">
                        {inboxCount}
                        <span className="sr-only"> {t("waiting")}</span>
                      </span>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-0.5">
            {collapsed ? null : (
              <div className="flex h-7 items-center justify-between px-2.5">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-subtle">
                  {t("agentsSection")}
                </h2>
                <Link
                  href="/agenten/neu"
                  aria-label={t("newAgent")}
                  title={t("newAgent")}
                  onClick={onNavigate}
                  className="-mr-1 inline-flex size-6 items-center justify-center rounded-md text-text-subtle hover:bg-surface-hover hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <Plus aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            )}
            <NavLink
              item={agentsNav}
              label={t("allAgents")}
              collapsed={collapsed}
              active={isActive(pathname, agentsNav.href)}
              onNavigate={onNavigate}
            />
            {collapsed ? null : agents.length === 0 ? (
              <p className="px-2.5 pt-1 text-xs leading-relaxed text-text-subtle">
                {t("agentsEmpty")}
              </p>
            ) : (
              <ul aria-label={t("agentsSection")} className="flex flex-col gap-0.5 pt-1">
                {agents.map((agent) => (
                  <li key={agent.id}>
                    <Link
                      href={`/agenten/${agent.id}`}
                      aria-current={pathname === `/agenten/${agent.id}` ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "flex h-8 min-w-0 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
                        pathname === `/agenten/${agent.id}`
                          ? "bg-surface font-medium text-text shadow-sm ring-1 ring-border"
                          : "text-text-muted hover:bg-surface-hover hover:text-text",
                      )}
                    >
                      <Avatar name={agent.name} size="sm" />
                      <span className="truncate">{agent.name}</span>
                    </Link>
                    {agent.conversations.length > 0 ? (
                      <ul className="ml-[22px] flex flex-col border-l border-border pl-2">
                        {agent.conversations.map((conversation) => {
                          const href = `/chat/${agent.id}/${conversation.id}`;
                          return (
                            <li key={conversation.id}>
                              <Link
                                href={href}
                                aria-current={pathname === href ? "page" : undefined}
                                onClick={onNavigate}
                                className={cn(
                                  "block truncate rounded-md px-2 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-focus",
                                  pathname === href
                                    ? "bg-surface font-medium text-text"
                                    : "text-text-muted hover:bg-surface-hover hover:text-text",
                                )}
                              >
                                {conversation.title || t("untitledConversation")}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-0.5">
          <NavLink
            item={settingsLink}
            label={tNav("settings")}
            collapsed={collapsed}
            active={isActive(pathname, settingsLink.href)}
            onNavigate={onNavigate}
          />
          {user.isPlatformAdmin ? (
            <NavLink
              item={adminNav}
              label={tNav("admin")}
              collapsed={collapsed}
              active={isActive(pathname, adminNav.href)}
              onNavigate={onNavigate}
            />
          ) : null}
          {collapsed ? (
            <Tooltip content={t("help")} side="right">
              <button
                type="button"
                aria-label={t("help")}
                onClick={onOpenHelp}
                className="flex h-9 items-center justify-center rounded-md text-text-subtle hover:bg-surface-hover hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
              >
                <CircleQuestionMark aria-hidden="true" className="size-[18px]" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={onOpenHelp}
              className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] text-text-muted hover:bg-surface-hover hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
            >
              <CircleQuestionMark aria-hidden="true" className="size-[18px] text-text-subtle" />
              {t("help")}
            </button>
          )}
        </div>
      </nav>
      <div className="flex flex-col gap-0.5 border-t border-border pt-2">
        <WorkspaceSwitcher active={active} workspaces={workspaces} collapsed={collapsed} />
        <UserMenu user={user} collapsed={collapsed} onOpenCommands={onOpenCommands} />
      </div>
    </div>
  );
}

/** Logo mark: two overlapping rounded shapes in the accent colour – an envelope abstracted. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      fill="none"
    >
      <rect x="2" y="4" width="20" height="16" rx="5" className="fill-accent" />
      <path
        d="M6.5 9.5 12 13l5.5-3.5"
        className="stroke-accent-text"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
