import "server-only";
import { shellContext } from "./app-context";
import { serverCaller } from "./caller";

/**
 * tRPC caller bound to the active workspace of the page – the same one the shell shows, also
 * when the `ep_ws` cookie is missing and the first workspace is used.
 */
export async function activeCaller() {
  const context = await shellContext();
  return serverCaller(context?.active?.id);
}
