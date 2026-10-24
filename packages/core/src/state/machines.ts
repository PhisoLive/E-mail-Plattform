/**
 * State machines from concept chapter 4. Every status change goes through `transition()`,
 * which rejects transitions not listed here.
 */
export const machines = {
  message: {
    draft: ["pending_approval", "scheduled", "cancelled"],
    pending_approval: ["scheduled", "cancelled"],
    scheduled: ["queued", "skipped", "cancelled"],
    queued: ["sending", "scheduled", "skipped", "cancelled", "failed"],
    sending: ["sent", "failed", "scheduled", "uncertain"],
    uncertain: ["sent", "queued"],
    sent: [],
    failed: [],
    skipped: [],
    cancelled: [],
    received: [],
  },
  campaign: {
    draft: ["planning", "cancelled"],
    planning: ["ready", "draft", "failed"],
    ready: ["pending_approval", "scheduled", "running", "draft", "cancelled"],
    pending_approval: ["scheduled", "running", "ready", "cancelled"],
    scheduled: ["running", "paused", "cancelled"],
    running: ["paused", "completed", "cancelled"],
    // Cancelling a paused campaign is allowed (docs/ENTSCHEIDUNGEN.md).
    paused: ["running", "cancelled"],
    completed: [],
    cancelled: [],
    failed: [],
  },
  recipient: {
    pending: ["active", "skipped"],
    active: ["replied", "completed", "bounced", "unsubscribed", "skipped", "failed", "paused"],
    paused: ["active"],
    completed: ["replied"],
    replied: [],
    bounced: [],
    unsubscribed: [],
    skipped: [],
    failed: [],
  },
  mailbox: {
    connecting: ["warming", "active", "error", "disconnected"],
    warming: ["active", "paused", "needs_reauth", "error", "disconnected"],
    active: ["paused", "needs_reauth", "error", "disconnected"],
    paused: ["warming", "active", "disconnected"],
    needs_reauth: ["warming", "active", "disconnected"],
    error: ["warming", "active", "disconnected"],
    disconnected: [],
  },
  approval: {
    pending: ["approved", "rejected", "expired"],
    approved: [],
    rejected: [],
    expired: [],
  },
  task: {
    open: ["done", "dismissed"],
    done: [],
    dismissed: [],
  },
} as const;

export type EntityKind = keyof typeof machines;
export type EntityState<E extends EntityKind> = keyof (typeof machines)[E] & string;

export function canTransition<E extends EntityKind>(
  entity: E,
  from: EntityState<E>,
  to: EntityState<E>,
): boolean {
  const allowed = (machines[entity] as Record<string, readonly string[]>)[from];
  return allowed?.includes(to) ?? false;
}

export function isFinalState<E extends EntityKind>(entity: E, state: EntityState<E>): boolean {
  return ((machines[entity] as Record<string, readonly string[]>)[state]?.length ?? 0) === 0;
}

/** Sending-ready mailbox states (concept chapter 4). */
export const sendReadyMailboxStates = ["warming", "active"] as const;
