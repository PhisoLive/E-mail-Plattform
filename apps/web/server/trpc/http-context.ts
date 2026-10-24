import "server-only";
import { webEnv } from "../env";
import { runtime } from "../runtime";
import { requestIpHash, sessionFromHeaders, workspaceCookie } from "../session";
import type { TrpcContext } from "./context";

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

export async function createHttpContext(request: Request): Promise<TrpcContext> {
  return createContextFromHeaders(request.headers);
}

export async function createContextFromHeaders(requestHeaders: Headers): Promise<TrpcContext> {
  const { core, mailer } = runtime();
  const session = await sessionFromHeaders(requestHeaders);
  const workspaceId =
    requestHeaders.get("x-workspace-id") ??
    readCookie(requestHeaders.get("cookie"), workspaceCookie);
  const ip = requestIpHash(requestHeaders);
  return {
    deps: core.deps,
    session,
    workspaceId,
    mailer,
    webUrl: webEnv().WEB_URL,
    ...(ip ? { ipHash: ip } : {}),
  };
}
