import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../server/auth";

const handlers = {
  GET: (request: Request) => toNextJsHandler(auth()).GET(request),
  POST: (request: Request) => toNextJsHandler(auth()).POST(request),
};

export const { GET, POST } = handlers;
