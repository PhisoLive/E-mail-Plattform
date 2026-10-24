import { auditLogs, mailboxes, messages, workspaces } from "@ep/db";
import { createTestDeps, createTestWorkspace } from "@ep/testing";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rebuildQueues, setTrustLevel } from "./operations";

const deps = createTestDeps();

describe("ops commands", () => {
  it("sets the trust level with an audit entry", async () => {
    const workspace = await createTestWorkspace(deps);
    const result = await setTrustLevel(deps, workspace.id, "verified", "Beta-Freigabe");
    expect(result).toMatchObject({ from: "new", to: "verified" });
    const [row] = await deps.db.select().from(workspaces).where(eq(workspaces.id, workspace.id));
    expect(row?.trustLevel).toBe("verified");
    const audit = await deps.db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.workspaceId, workspace.id), eq(auditLogs.action, "trust.set")));
    expect(audit[0]?.data).toMatchObject({ reason: "Beta-Freigabe" });
    await expect(setTrustLevel(deps, workspace.id, "verified", "")).rejects.toThrow();
  });

  it("re-enqueues queued messages and marks crashed sends as uncertain", async () => {
    const workspace = await createTestWorkspace(deps);
    const [mailbox] = await deps.db
      .insert(mailboxes)
      .values({
        workspaceId: workspace.id,
        email: "max@firma.test",
        displayName: "Max",
        provider: "imap_smtp",
        status: "active",
      })
      .returning({ id: mailboxes.id });
    if (!mailbox) throw new Error("mailbox");
    const [queued] = await deps.db
      .insert(messages)
      .values({
        workspaceId: workspace.id,
        mailboxId: mailbox.id,
        direction: "outbound",
        status: "queued",
        attemptCount: 1,
      })
      .returning({ id: messages.id });
    const [sending] = await deps.db
      .insert(messages)
      .values({
        workspaceId: workspace.id,
        mailboxId: mailbox.id,
        direction: "outbound",
        status: "sending",
      })
      .returning({ id: messages.id });

    const report = await rebuildQueues(deps);
    expect(report.requeued).toBeGreaterThanOrEqual(1);
    expect(deps.queue.jobs.some((job) => job.options.jobId === `send-${queued?.id}-1`)).toBe(true);
    const [crashed] = await deps.db
      .select()
      .from(messages)
      .where(eq(messages.id, sending?.id ?? ""));
    expect(crashed?.status).toBe("uncertain");
  });
});
