"use client";

import { useRef } from "react";

/** Elements a user can operate; containers like `<main tabIndex={-1}>` do not count. */
const controlSelector =
  'a[href], button, input, select, textarea, summary, [role="button"], [role="combobox"], [role="tab"], [tabindex]';

function isControl(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element !== document.body &&
    element.matches(controlSelector) &&
    element.tabIndex >= 0
  );
}

/** Trigger of the menu that contains the element, if any. */
function menuTrigger(element: Element): HTMLElement | null {
  const triggerId = element.closest('[role="menu"]')?.getAttribute("aria-labelledby");
  return triggerId ? document.getElementById(triggerId) : null;
}

/*
 * Where the focus was before a dialog opened is not always `document.activeElement`:
 * - a dialog opened from a menu item mounts after the menu is gone, the focus is on <body>;
 * - Safari does not focus a clicked button, the focus stays on <body> or a container.
 * So the last focus inside a menu and the control of the last pointer press are remembered.
 */
let lastMenuFocus: HTMLElement | null = null;
let lastPress: { control: HTMLElement; at: number } | null = null;
const pressMemoryMs = 1000;

if (typeof document !== "undefined") {
  document.addEventListener(
    "focusin",
    (event) => {
      lastMenuFocus = event.target instanceof Element ? menuTrigger(event.target) : null;
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target ? (menuTrigger(target) ?? target.closest(controlSelector)) : null;
      lastPress = isControl(control) ? { control, at: performance.now() } : null;
    },
    true,
  );
}

function focusOrigin(): HTMLElement | null {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) {
    const trigger = menuTrigger(active);
    if (trigger) return trigger;
    if (isControl(active)) return active;
  }
  if (lastPress?.control.isConnected && performance.now() - lastPress.at < pressMemoryMs) {
    return lastPress.control;
  }
  if (lastMenuFocus?.isConnected) return lastMenuFocus;
  // e.g. <main> after the skip link – better than <body>
  return active instanceof HTMLElement && active !== document.body ? active : null;
}

/**
 * Does the dialog have a Radix trigger (`aria-controls` = content id, set while open)? Radix
 * returns the focus there itself.
 */
function hasTrigger(content: EventTarget | null): boolean {
  if (!(content instanceof HTMLElement) || !content.id) return false;
  const id = content.id.replace(/["\\]/g, "\\$&");
  return document.querySelector(`[aria-controls="${id}"]`) !== null;
}

/**
 * Focus handling for Radix dialogs. A dialog with a DialogTrigger keeps Radix' behaviour (focus
 * back to the trigger). A dialog opened another way (shortcut, menu item, state) gets the focus
 * back where it was, or – if that element is gone – to `fallback` (WCAG 2.4.3).
 */
export function useFocusReturn(fallback?: () => HTMLElement | null) {
  const origin = useRef<HTMLElement | null>(null);
  const triggered = useRef(false);
  return {
    onOpenAutoFocus: (event: Event) => {
      // Radix calls this before it moves the focus into the dialog.
      origin.current = focusOrigin();
      triggered.current = hasTrigger(event.target);
    },
    onCloseAutoFocus: (event: Event) => {
      const remembered = origin.current;
      origin.current = null;
      if (triggered.current) return;
      const target = remembered?.isConnected ? remembered : (fallback?.() ?? null);
      if (!target?.isConnected) return;
      event.preventDefault();
      target.focus({ preventScroll: true });
    },
  };
}
