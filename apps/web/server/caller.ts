import "server-only";
import { headers } from "next/headers";
import { currentSession } from "./session";
import { createContextFromHeaders } from "./trpc/http-context";
import { createCallerFactory } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";

const createCaller = createCallerFactory(appRouter);

/** tRPC caller for Server Components – same rights checks as the HTTP API. */
export async function serverCaller(workspaceId?: string) {
  const requestHeaders = new Headers(await headers());
  if (workspaceId) requestHeaders.set("x-workspace-id", workspaceId);
  return createCaller(await createContextFromHeaders(requestHeaders, await currentSession()));
}
