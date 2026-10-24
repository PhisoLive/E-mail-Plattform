import "server-only";
import type { LookupKind, LookupResult } from "@ep/core/services/lookup";
import { TRPCError } from "@trpc/server";
import { activeCaller } from "./workspace-caller";

/** One object of the current workspace for a detail page, or null (unknown, foreign or invalid). */
export async function lookup(kind: LookupKind, id: string): Promise<LookupResult | null> {
  try {
    return await (await activeCaller()).lookup.get({ kind, id });
  } catch (error) {
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST"))
      return null;
    throw error;
  }
}
