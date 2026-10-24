import { router } from "../init";
import { invitationRouter } from "./invitation";
import { teamRouter } from "./team";
import { workspaceRouter } from "./workspace";

export const appRouter = router({
  workspace: workspaceRouter,
  team: teamRouter,
  invitation: invitationRouter,
});

export type AppRouter = typeof appRouter;
