import type { Database } from "@ep/db";
import type { JobQueue } from "./jobs/queue";
import type { LivePublisher } from "./live/publisher";

export type MemberRole = "owner" | "admin" | "member" | "viewer";

export interface Actor {
  type: "user" | "agent" | "system";
  id: string | null;
}

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** Dependencies of the service layer. Created once per process (web, edge, worker). */
export interface CoreDeps {
  db: Database;
  live: LivePublisher;
  queue: JobQueue;
  /** HMAC key for `email_hash` – only used inside `emailHash()`. */
  emailHashKey: Buffer;
  clock: Clock;
}

/** Context of a request inside one workspace. Every tenant query needs it. */
export interface WorkspaceContext {
  readonly kind: "workspace";
  readonly deps: CoreDeps;
  readonly workspaceId: string;
  readonly actor: Actor;
  /** Role of the acting user; agents and system jobs act with the rights given to them. */
  readonly role: MemberRole;
  readonly ipHash?: string;
}

/** Context of a signed-in user outside a workspace (create workspace, accept invitation). */
export interface UserContext {
  readonly kind: "user";
  readonly deps: CoreDeps;
  readonly userId: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly ipHash?: string;
}

export function workspaceContext(
  deps: CoreDeps,
  workspaceId: string,
  actor: Actor,
  role: MemberRole,
  ipHash?: string,
): WorkspaceContext {
  return ipHash
    ? { kind: "workspace", deps, workspaceId, actor, role, ipHash }
    : { kind: "workspace", deps, workspaceId, actor, role };
}
