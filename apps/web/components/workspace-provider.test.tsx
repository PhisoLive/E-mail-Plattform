// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { selectWorkspace } from "../lib/workspace-store";
import messages from "../messages/de.json";
import { WorkspaceProvider } from "./workspace-provider";

afterEach(cleanup);

function renderFor(id: string) {
  return render(
    <NextIntlClientProvider locale="de" messages={{ shell: messages.shell }}>
      <WorkspaceProvider workspace={{ id, name: "Bäckerei Huber", role: "owner" }}>
        <p>Inhalt</p>
      </WorkspaceProvider>
    </NextIntlClientProvider>,
  );
}

describe("WorkspaceProvider", () => {
  it("offers a reload when another tab switches the workspace", async () => {
    renderFor("ws-a");
    expect(screen.queryByRole("button", { name: "Neu laden" })).not.toBeInTheDocument();
    const otherTab = new BroadcastChannel("ep-workspace");
    otherTab.postMessage({ workspaceId: "ws-b" });
    expect(await screen.findByRole("button", { name: "Neu laden" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("in einem anderen Tab");
    otherTab.close();
  });

  it("stays quiet when this tab switches the workspace itself", async () => {
    renderFor("ws-a");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    await selectWorkspace("ws-b");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("button", { name: "Neu laden" })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("stays quiet when another tab selects the same workspace", async () => {
    renderFor("ws-a");
    const otherTab = new BroadcastChannel("ep-workspace");
    otherTab.postMessage({ workspaceId: "ws-a" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("button", { name: "Neu laden" })).not.toBeInTheDocument();
    otherTab.close();
  });
});
