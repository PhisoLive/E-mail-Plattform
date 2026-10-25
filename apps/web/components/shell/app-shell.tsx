"use client";

import {
  Dialog,
  DialogContent,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  IconButton,
  Kbd,
  TooltipProvider,
} from "@ep/ui";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { setPreferenceCookie } from "../../lib/preference-cookie";
import { BrandMark } from "../brand-mark";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { type ShellAgent, type ShellUser, type ShellWorkspace, sidebarCookie } from "./types";
import { useModifierKey } from "./use-modifier-key";

export interface AppShellProps {
  user: ShellUser;
  workspaces: ShellWorkspace[];
  active: ShellWorkspace | null;
  initialCollapsed: boolean;
  agents: ShellAgent[];
  inboxCount: number;
  children: ReactNode;
}

/**
 * Has a shell been mounted before in this page? The app area and the operator area are separate
 * route groups (E-048): navigating between them mounts a new shell, and the focus would be lost.
 */
let shellMountedBefore = false;

/**
 * App shell (concept chapter 13): collapsible sidebar on large screens, top bar with a
 * navigation drawer below 1024 px, command palette on Ctrl+K / ⌘K.
 */
export function AppShell({
  user,
  workspaces,
  active,
  initialCollapsed,
  agents,
  inboxCount,
  children,
}: AppShellProps) {
  const t = useTranslations("shell");
  const tCommon = useTranslations("common");
  const tApp = useTranslations("app");
  const modifier = useModifierKey();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  // Palette and help opened from the drawer: the drawer and the item are gone when they close.
  const returnToMenu = useCallback(
    () => (menuButton.current?.offsetParent ? menuButton.current : null),
    [],
  );
  const effectRan = useRef(false);

  useEffect(() => {
    // React's strict mode runs the effect twice for the same instance – only the first run counts.
    if (effectRan.current) return;
    effectRan.current = true;
    // A new shell after a navigation (not the first page load): focus the start of the content.
    if (shellMountedBefore) {
      const active = document.activeElement;
      if (!active || active === document.body) {
        document.getElementById("inhalt")?.focus({ preventScroll: true });
      }
    }
    shellMountedBefore = true;
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      setPreferenceCookie(sidebarCookie, next ? "collapsed" : "open");
      return next;
    });
  }, []);

  const openCommands = useCallback(() => {
    setDrawerOpen(false);
    setPaletteOpen(true);
  }, []);
  const openHelp = useCallback(() => {
    setDrawerOpen(false);
    setHelpOpen(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDrawerOpen(false);
        setPaletteOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sidebarProps = {
    user,
    workspaces,
    active,
    agents,
    inboxCount,
    onOpenCommands: openCommands,
    onOpenHelp: openHelp,
  };

  return (
    <TooltipProvider delayDuration={250}>
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md"
      >
        {tCommon("skipToContent")}
      </a>
      <div className="flex min-h-dvh">
        <aside
          aria-label={t("sidebar")}
          className={
            collapsed
              ? "sticky top-0 hidden h-dvh w-[68px] shrink-0 border-r border-border bg-sidebar lg:block"
              : "sticky top-0 hidden h-dvh w-[260px] shrink-0 border-r border-border bg-sidebar lg:block"
          }
        >
          <Sidebar {...sidebarProps} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-bg/90 px-2 backdrop-blur-md lg:hidden">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <IconButton ref={menuButton} label={t("openNavigation")}>
                  <Menu aria-hidden="true" />
                </IconButton>
              </DrawerTrigger>
              <DrawerContent title={t("navigation")} closeLabel={t("closeNavigation")}>
                <Sidebar
                  {...sidebarProps}
                  collapsed={false}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </DrawerContent>
            </Drawer>
            <Link
              href="/start"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-[15px] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-focus"
            >
              <BrandMark />
              <span className="truncate">{active?.name ?? tApp("name")}</span>
            </Link>
            <IconButton label={t("search")} onClick={openCommands}>
              <Search aria-hidden="true" />
            </IconButton>
          </header>

          <main
            id="inhalt"
            tabIndex={-1}
            className="flex-1 px-4 pt-6 pb-16 outline-none sm:px-6 lg:px-10 lg:pt-10"
          >
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        user={user}
        workspaces={workspaces}
        active={active}
        returnFocus={returnToMenu}
      />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent
          title={t("helpTitle")}
          description={t("helpText")}
          closeLabel={tCommon("close")}
          returnFocus={returnToMenu}
        >
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted">{t("shortcutPalette")}</dt>
              <dd className="flex items-center gap-1">
                <Kbd>{modifier}</Kbd>
                <Kbd>K</Kbd>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted">{t("shortcutClose")}</dt>
              <dd>
                <Kbd>{t("keys.escape")}</Kbd>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted">{t("shortcutSkip")}</dt>
              <dd>
                <Kbd>{t("keys.tab")}</Kbd>
              </dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
