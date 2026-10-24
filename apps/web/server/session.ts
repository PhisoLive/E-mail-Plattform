import "server-only";
import { ipHash, workspaceService } from "@ep/core";
import { cookies, headers } from "next/headers";
import { auth } from "./auth";
import { runtime } from "./runtime";
import type { SessionInfo } from "./trpc/context";

export const workspaceCookie = "ep_ws";

/** Session of the current request, mapped to what the platform needs. */
export async function sessionFromHeaders(requestHeaders: Headers): Promise<SessionInfo | null> {
  const result = await auth().api.getSession({ headers: requestHeaders });
  if (!result) return null;
  const { user, session } = result;
  // Rights-relevant fields come fresh from the database, not from Better Auth's session cache.
  const profile = await workspaceService.getUserProfile({
    kind: "user",
    deps: runtime().core.deps,
    userId: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
  });
  if (!profile) return null;
  return {
    userId: user.id,
    email: profile.email,
    name: profile.name,
    emailVerified: user.emailVerified,
    twoFactorEnabled: profile.twoFactorEnabled,
    platformRole: profile.platformRole,
    signedInAt: new Date(session.createdAt),
  };
}

export async function currentSession(): Promise<SessionInfo | null> {
  return sessionFromHeaders(await headers());
}

export async function selectedWorkspaceId(): Promise<string | null> {
  return (await cookies()).get(workspaceCookie)?.value ?? null;
}

export function requestIpHash(requestHeaders: Headers): string | undefined {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ipHash(runtime().core.deps.emailHashKey, forwarded ?? requestHeaders.get("x-real-ip"));
}
