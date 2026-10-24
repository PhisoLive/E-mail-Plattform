import { router } from "../init";
import { invitationRouter } from "./invitation";
import { lookupRouter } from "./lookup";
import { senderProfileRouter } from "./sender-profile";
import { teamRouter } from "./team";
import { workspaceRouter } from "./workspace";

export const appRouter = router({
  workspace: workspaceRouter,
  team: teamRouter,
  invitation: invitationRouter,
  senderProfile: senderProfileRouter,
  lookup: lookupRouter,
});

export type AppRouter = typeof appRouter;
