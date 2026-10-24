import { senderProfileService } from "@ep/core";
import { unwrapResult } from "../errors";
import { router, workspaceProcedure } from "../init";

export const senderProfileRouter = router({
  /** Sender profile with the mandatory fields of its legal form. */
  get: workspaceProcedure.query(async ({ ctx }) =>
    unwrapResult(await senderProfileService.getSenderProfile(ctx.ws)),
  ),

  update: workspaceProcedure
    .input(senderProfileService.senderProfileInput)
    .mutation(async ({ ctx, input }) =>
      unwrapResult(await senderProfileService.updateSenderProfile(ctx.ws, input)),
    ),
});
