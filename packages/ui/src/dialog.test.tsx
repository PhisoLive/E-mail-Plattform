// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CommandDialog } from "./command";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";

afterEach(cleanup);

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

function Shell() {
  const [drawer, setDrawer] = useState(true);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button">Navigation öffnen</button>
      {drawer ? (
        <button
          type="button"
          onClick={() => {
            setDrawer(false);
            setOpen(true);
          }}
        >
          Suchen
        </button>
      ) : null}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Befehlspalette"
        placeholder="Suchen …"
        emptyText="Nichts gefunden"
        returnFocus={() => screen.getByRole("button", { name: "Navigation öffnen" })}
      >
        {null}
      </CommandDialog>
    </>
  );
}

describe("focus return of dialogs", () => {
  it("keeps Radix' return to the trigger, also when the click did not focus it (Safari)", async () => {
    render(
      <main id="inhalt" tabIndex={-1}>
        <Dialog>
          <DialogTrigger>Vorschau</DialogTrigger>
          <DialogContent title="Vorlage" closeLabel="Schließen">
            <p>Inhalt</p>
          </DialogContent>
        </Dialog>
      </main>,
    );
    // Safari leaves the focus on the nearest focusable container instead of the button.
    screen.getByRole("main").focus();
    fireEvent.click(screen.getByRole("button", { name: "Vorschau" }));
    expect(await screen.findByRole("dialog", { name: "Vorlage" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Vorschau" })).toHaveFocus());
  });

  it("falls back to the given element when the opener is gone", async () => {
    render(<Shell />);
    await userEvent.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByRole("dialog", { name: "Befehlspalette" })).toBeInTheDocument();
    await act(async () => {
      await userEvent.keyboard("{Escape}");
    });
    await vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Navigation öffnen" })).toHaveFocus(),
    );
  });
});
