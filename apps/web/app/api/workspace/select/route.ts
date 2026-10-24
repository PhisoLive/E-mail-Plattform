import { defaults } from "@ep/config/defaults";
import { workspaceService } from "@ep/core";
import { z } from "zod";
import { isSameOrigin } from "../../../../server/origin";
import { runtime } from "../../../../server/runtime";
import { sessionFromHeaders, workspaceCookie } from "../../../../server/session";

const body = z.object({ workspaceId: z.uuid() });

/** Switches the active workspace after checking the membership. */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFromHeaders(request.headers);
  if (!session) return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "VALIDATION" }, { status: 400 });
  const role = await workspaceService.getMembershipRole(
    {
      kind: "user",
      deps: runtime().core.deps,
      userId: session.userId,
      email: session.email,
      emailVerified: session.emailVerified,
    },
    parsed.data.workspaceId,
  );
  if (!role) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  const secure = new URL(request.url).protocol === "https:";
  const response = Response.json({ ok: true, role });
  response.headers.append(
    "set-cookie",
    `${workspaceCookie}=${parsed.data.workspaceId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${defaults.cookies.preferenceDays * 24 * 60 * 60}${secure ? "; Secure" : ""}`,
  );
  return response;
}
