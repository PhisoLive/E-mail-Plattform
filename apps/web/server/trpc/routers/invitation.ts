import { invitationService } from "@ep/core";
import { z } from "zod";
import { unwrapResult } from "../errors";
import { authedProcedure, publicProcedure, router } from "../init";

const tokenInput = z.object({ token: z.string().min(20).max(100) });

export const invitationRouter = router({
  /** Public: shows workspace name and role for the invitation page. */
  preview: publicProcedure
    .input(tokenInput)
    .query(async ({ ctx, input }) =>
      unwrapResult(await invitationService.previewInvitation(ctx.deps, input.token)),
    ),

  accept: authedProcedure
    .input(tokenInput)
    .mutation(async ({ ctx, input }) =>
      unwrapResult(await invitationService.acceptInvitation(ctx.userCtx, input.token)),
    ),
});
