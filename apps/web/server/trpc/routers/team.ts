import { invitationService, memberService } from "@ep/core";
import { z } from "zod";
import { emailTranslator, formatDateDe, roleTranslator } from "../../email-texts";
import { unwrapResult } from "../errors";
import { freshWorkspaceProcedure, router, workspaceProcedure } from "../init";

export const teamRouter = router({
  members: workspaceProcedure.query(async ({ ctx }) =>
    unwrapResult(await memberService.listMembers(ctx.ws)),
  ),

  changeRole: freshWorkspaceProcedure
    .input(memberService.changeRoleInput)
    .mutation(async ({ ctx, input }) =>
      unwrapResult(await memberService.changeMemberRole(ctx.ws, input)),
    ),

  removeMember: freshWorkspaceProcedure
    .input(z.object({ memberId: z.uuid() }))
    .mutation(async ({ ctx, input }) =>
      unwrapResult(await memberService.removeMember(ctx.ws, input.memberId)),
    ),

  invitations: workspaceProcedure.query(async ({ ctx }) =>
    unwrapResult(await invitationService.listInvitations(ctx.ws)),
  ),

  invite: freshWorkspaceProcedure
    .input(invitationService.createInvitationInput)
    .mutation(async ({ ctx, input }) => {
      const invitation = unwrapResult(await invitationService.createInvitation(ctx.ws, input));
      const url = new URL(`/einladung/${invitation.token}`, ctx.webUrl).toString();
      await ctx.mailer.send({
        to: invitation.email,
        subject: emailTranslator("invitation.subject", { workspace: invitation.workspaceName }),
        text: emailTranslator("invitation.text", {
          inviter: ctx.session.name,
          workspace: invitation.workspaceName,
          role: roleTranslator(invitation.role),
          url,
          date: formatDateDe(invitation.expiresAt),
        }),
      });
      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      };
    }),

  revokeInvitation: freshWorkspaceProcedure
    .input(z.object({ invitationId: z.uuid() }))
    .mutation(async ({ ctx, input }) =>
      unwrapResult(await invitationService.revokeInvitation(ctx.ws, input.invitationId)),
    ),
});
