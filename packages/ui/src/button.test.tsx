// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("keeps a submit button disabled in the server HTML until it is hydrated", () => {
    expect(renderToString(<Button type="submit">Speichern</Button>)).toMatch(/disabled=""/);
    expect(renderToString(<Button>Abbrechen</Button>)).not.toMatch(/disabled=""/);
  });

  it("enables the submit button once it runs in the browser", () => {
    render(<Button type="submit">Speichern</Button>);
    expect(screen.getByRole("button", { name: "Speichern" })).toBeEnabled();
  });

  it("stays focusable while loading and ignores clicks and submits meanwhile", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Speichern
        </Button>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Speichern" });
    button.focus();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
