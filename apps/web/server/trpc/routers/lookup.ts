import { lookupService } from "@ep/core";
import { unwrapResult } from "../errors";
import { router, workspaceProcedure } from "../init";

/** Title and status of one object for the detail pages of the app shell (phase 1). */
export const lookupRouter = router({
  get: workspaceProcedure
    .input(lookupService.lookupInput)
    .query(async ({ ctx, input }) => unwrapResult(await lookupService.lookupObject(ctx.ws, input))),
});
