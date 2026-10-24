import type { CoreDeps } from "@ep/core";
import type { SystemMailer } from "@ep/mail";

/** What the tRPC layer needs to know about the signed-in user. */
export interface SessionInfo {
  userId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  platformRole: string;
  /** Time of the last real sign-in (session creation) – for "fresh login" checks. */
  signedInAt: Date;
}

export interface TrpcContext {
  deps: CoreDeps;
  session: SessionInfo | null;
  /** Workspace selected by the client (header `x-workspace-id` or cookie `ep_ws`). */
  workspaceId: string | null;
  ipHash?: string;
  mailer: SystemMailer;
  webUrl: string;
}
