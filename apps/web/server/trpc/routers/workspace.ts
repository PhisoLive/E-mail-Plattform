import { onboardingService, shellService, workspaceService } from "@ep/core";
import { z } from "zod";
import { unwrapResult } from "../errors";
import { authedProcedure, router, workspaceProcedure } from "../init";

export const workspaceRouter = router({
  /** Workspaces of the signed-in user. */
  list: authedProcedure.query(({ ctx }) => workspaceService.listMyWorkspaces(ctx.userCtx)),

  create: authedProcedure
    .input(workspaceService.createWorkspaceInput)
    .mutation(async ({ ctx, input }) =>
      unwrapResult(await workspaceService.createWorkspace(ctx.userCtx, input)),
    ),

  current: workspaceProcedure
    .meta({ allowWithoutTwoFactor: true })
    .query(async ({ ctx }) => unwrapResult(await workspaceService.getWorkspace(ctx.ws))),

  update: workspaceProcedure
    .input(workspaceService.updateWorkspaceInput)
    .mutation(async ({ ctx, input }) =>
      unwrapResult(await workspaceService.updateWorkspace(ctx.ws, input)),
    ),

  /** Agents with recent conversations and the inbox counter for the sidebar. */
  shell: workspaceProcedure.query(async ({ ctx }) =>
    unwrapResult(await shellService.getShellSummary(ctx.ws)),
  ),

  /** Onboarding checklist of the start page and `/willkommen`. */
  onboarding: workspaceProcedure.query(async ({ ctx }) =>
    unwrapResult(await onboardingService.getOnboardingStatus(ctx.ws)),
  ),

  me: authedProcedure.query(({ ctx }) => ({
    name: ctx.session.name,
    email: ctx.session.email,
    twoFactorEnabled: ctx.session.twoFactorEnabled,
  })),
});

export const workspaceIdInput = z.object({ workspaceId: z.uuid() });
