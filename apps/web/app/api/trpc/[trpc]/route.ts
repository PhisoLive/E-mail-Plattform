import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { isSameOrigin } from "../../../../server/origin";
import { runtime } from "../../../../server/runtime";
import { createHttpContext } from "../../../../server/trpc/http-context";
import { appRouter } from "../../../../server/trpc/routers/_app";

async function handler(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createHttpContext(request),
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        runtime().logger.error(
          { path, error: error.cause?.name ?? error.name },
          "trpc internal error",
        );
      }
    },
  });
}

export { handler as GET, handler as POST };
