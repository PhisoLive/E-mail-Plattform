// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CommandDialog, CommandGroup, CommandItem } from "./command";

afterEach(cleanup);

beforeAll(() => {
  // cmdk measures and scrolls items; jsdom has neither.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

function Palette({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <CommandDialog
      open
      onOpenChange={() => {}}
      title="Befehlspalette"
      placeholder="Suchen …"
      emptyText="Nichts gefunden"
    >
      <CommandGroup heading="Springen zu">
        <CommandItem value="nav-start" keywords={["Start"]} onSelect={() => onSelect("start")}>
          Start
        </CommandItem>
        <CommandItem
          value="nav-templates"
          keywords={["Vorlagen"]}
          onSelect={() => onSelect("templates")}
        >
          Vorlagen
        </CommandItem>
      </CommandGroup>
    </CommandDialog>
  );
}

describe("CommandDialog", () => {
  it("is a named dialog with a combobox and filters while typing", async () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);
    expect(screen.getByRole("dialog", { name: "Befehlspalette" })).toBeInTheDocument();
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "Vorl");
    expect(screen.queryByRole("option", { name: "Start" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("templates");
  });

  it("shows the empty text when nothing matches", async () => {
    render(<Palette onSelect={() => {}} />);
    await userEvent.type(screen.getByRole("combobox"), "xyz");
    expect(screen.getByText("Nichts gefunden")).toBeInTheDocument();
  });
});
