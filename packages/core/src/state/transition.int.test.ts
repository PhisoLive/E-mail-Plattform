import { entityEvents, tasks } from "@ep/db";
import { createTestDeps, createTestWorkspace } from "@ep/testing";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { withWorkspace } from "../scope";
import { recordCreated, transition } from "./transition";

const deps = createTestDeps();

async function createTask(workspaceId: string) {
  const [task] = await deps.db
    .insert(tasks)
    .values({ workspaceId, kind: "hint" })
    .returning({ id: tasks.id });
  if (!task) throw new Error("insert failed");
  return task.id;
}

describe("transition()", () => {
  it("changes the status, writes an event and publishes after commit", async () => {
    const workspace = await createTestWorkspace(deps);
    const taskId = await createTask(workspace.id);
    const result = await withWorkspace(workspace.ownerCtx, (scope) =>
      transition(scope, "task", taskId, "open", "done", "user_resolved", {
        set: { resolvedAt: new Date() },
      }),
    );
    expect(result).toEqual({ ok: true, value: { from: "open", to: "done" } });
    const [row] = await deps.db.select().from(tasks).where(eq(tasks.id, taskId));
    expect(row?.status).toBe("done");
    expect(row?.resolvedAt).toBeInstanceOf(Date);
    const events = await deps.db
      .select()
      .from(entityEvents)
      .where(and(eq(entityEvents.workspaceId, workspace.id), eq(entityEvents.entityId, taskId)));
    expect(events).toEqual([
      expect.objectContaining({ fromStatus: "open", toStatus: "done", reason: "user_resolved" }),
    ]);
    expect(deps.live.events).toContainEqual({
      workspaceId: workspace.id,
      event: expect.objectContaining({ type: "task.created", id: taskId, status: "done" }),
    });
  });

  it("rejects transitions that are not in the state machine", async () => {
    const workspace = await createTestWorkspace(deps);
    const taskId = await createTask(workspace.id);
    const result = await withWorkspace(workspace.ownerCtx, (scope) =>
      transition(scope, "task", taskId, "done", "open", "x"),
    );
    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_TRANSITION" } });
  });

  it("detects a changed source state (conditional update)", async () => {
    const workspace = await createTestWorkspace(deps);
    const taskId = await createTask(workspace.id);
    await withWorkspace(workspace.ownerCtx, (scope) =>
      transition(scope, "task", taskId, "open", "dismissed", "x"),
    );
    const second = await withWorkspace(workspace.ownerCtx, (scope) =>
      transition(scope, "task", taskId, "open", "done", "x"),
    );
    expect(second).toMatchObject({ ok: false, error: { code: "STATE_CHANGED" } });
  });

  it("cannot reach rows of another workspace", async () => {
    const a = await createTestWorkspace(deps);
    const b = await createTestWorkspace(deps);
    const taskId = await createTask(a.id);
    const result = await withWorkspace(b.ownerCtx, (scope) =>
      transition(scope, "task", taskId, "open", "done", "x"),
    );
    expect(result).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
    const [row] = await deps.db.select().from(tasks).where(eq(tasks.id, taskId));
    expect(row?.status).toBe("open");
  });

  it("publishes nothing when the transaction rolls back", async () => {
    const workspace = await createTestWorkspace(deps);
    const taskId = await createTask(workspace.id);
    const before = deps.live.events.length;
    await expect(
      withWorkspace(workspace.ownerCtx, async (scope) => {
        await recordCreated(scope, "task", taskId, "open");
        await transition(scope, "task", taskId, "open", "done", "x");
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(deps.live.events.length).toBe(before);
    const [row] = await deps.db.select().from(tasks).where(eq(tasks.id, taskId));
    expect(row?.status).toBe("open");
  });
});
