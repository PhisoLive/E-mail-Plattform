import "server-only";
import { webEnv } from "../env";
import { runtime } from "../runtime";
import { requestIpHash, sessionFromHeaders, workspaceCookie } from "../session";
import type { SessionInfo, TrpcContext } from "./context";

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

/** `session` may be passed in when the caller already read it for this request. */
export async function createContextFromHeaders(
  requestHeaders: Headers,
  knownSession?: SessionInfo | null,
): Promise<TrpcContext> {
  const { core, mailer } = runtime();
  const session =
    knownSession === undefined ? await sessionFromHeaders(requestHeaders) : knownSession;
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
