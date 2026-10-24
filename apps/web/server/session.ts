import "server-only";
import { ipHash } from "@ep/core";
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
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    twoFactorEnabled: Boolean((user as { twoFactorEnabled?: boolean | null }).twoFactorEnabled),
    platformRole: String((user as { platformRole?: string | null }).platformRole ?? "user"),
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
