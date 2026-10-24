// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SuggestOrWrite, type SuggestOrWriteSource } from "./suggest-or-write";

afterEach(cleanup);

const suggestions = [
  { id: "a", label: "Freundlich" },
  { id: "b", label: "Förmlich" },
  { id: "c", label: "Locker", value: "locker und kurz" },
  { id: "d", label: "Vier" },
  { id: "e", label: "Fünf" },
  { id: "f", label: "Sechs" },
];

function Harness({
  onChange,
  aiFill,
}: {
  onChange?: (value: string, source: SuggestOrWriteSource) => void;
  aiFill?: (value: string) => Promise<string>;
}) {
  const [value, setValue] = useState("");
  return (
    <SuggestOrWrite
      label="Ton"
      suggestions={suggestions}
      value={value}
      onChange={(next, source) => {
        setValue(next);
        onChange?.(next, source);
      }}
      suggestionsLabel="Vorschläge"
      hint="Die KI ergänzt den Rest."
      {...(aiFill ? { aiFill, aiFillLabel: "Ergänzen" } : {})}
    />
  );
}

describe("SuggestOrWrite", () => {
  it("shows at most five suggestions and marks the chosen one", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const group = screen.getByRole("group", { name: "Vorschläge" });
    expect(group.querySelectorAll("button")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "Sechs" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Locker" }));
    expect(onChange).toHaveBeenLastCalledWith("locker und kurz", "suggestion");
    expect(screen.getByRole("button", { name: "Locker" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Ton")).toHaveValue("locker und kurz");
  });

  it("accepts free text and deselects the chips", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Freundlich" }));
    const input = screen.getByLabelText("Ton");
    await userEvent.clear(input);
    await userEvent.type(input, "Herzlich");
    expect(onChange).toHaveBeenLastCalledWith("Herzlich", "free");
    expect(screen.getByRole("button", { name: "Freundlich" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(input).toHaveAccessibleDescription("Die KI ergänzt den Rest.");
  });

  it("lets the AI complete the text", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} aiFill={async (value) => `${value} – vervollständigt`} />);
    await userEvent.type(screen.getByLabelText("Ton"), "Kurz");
    await userEvent.click(screen.getByRole("button", { name: "Ergänzen" }));
    expect(onChange).toHaveBeenLastCalledWith("Kurz – vervollständigt", "ai");
  });
});
