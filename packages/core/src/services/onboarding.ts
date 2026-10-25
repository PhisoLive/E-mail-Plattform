import { agents, campaigns, mailboxes, senderProfiles, workspaces } from "@ep/db";
import { and, count, eq, isNull } from "drizzle-orm";
import type { WorkspaceContext } from "../context";
import { appError } from "../errors";
import { requirePermission } from "../permissions";
import { err, ok, type Result } from "../result";
import { withWorkspace } from "../scope";
import { isSenderProfileComplete } from "../sender/legal-forms";

/** Steps of the onboarding (concept chapter 13, `/willkommen`). */
export const onboardingSteps = [
  "workspace",
  "mailbox",
  "senderProfile",
  "agent",
  "campaign",
] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];

export interface OnboardingStatus {
  steps: Record<OnboardingStep, boolean>;
  done: number;
  total: number;
}

/** Which onboarding steps are done – read from the real data of the workspace. */
export async function getOnboardingStatus(
  ctx: WorkspaceContext,
): Promise<Result<OnboardingStatus>> {
  const permission = requirePermission(ctx.role, "workspace.view");
  if (!permission.ok) return permission;
  return withWorkspace(ctx, async (scope) => {
    const ws = scope.workspaceId;
    const [workspace] = await scope.tx
      .select({ kind: workspaces.kind, country: workspaces.country })
      .from(workspaces)
      .where(eq(workspaces.id, ws));
    if (!workspace) return err(appError("NOT_FOUND"));
    const [profile] = await scope.tx
      .select()
      .from(senderProfiles)
      .where(eq(senderProfiles.workspaceId, ws));
    const [mailboxCount] = await scope.tx
      .select({ value: count() })
      .from(mailboxes)
      .where(eq(mailboxes.workspaceId, ws));
    const [agentCount] = await scope.tx
      .select({ value: count() })
      .from(agents)
      .where(and(eq(agents.workspaceId, ws), isNull(agents.deletedAt)));
    const [campaignCount] = await scope.tx
      .select({ value: count() })
      .from(campaigns)
      .where(eq(campaigns.workspaceId, ws));
    const steps: Record<OnboardingStep, boolean> = {
      workspace: true,
      mailbox: (mailboxCount?.value ?? 0) > 0,
      senderProfile: profile ? isSenderProfileComplete(profile, workspace) : false,
      agent: (agentCount?.value ?? 0) > 0,
      campaign: (campaignCount?.value ?? 0) > 0,
    };
    const done = Object.values(steps).filter(Boolean).length;
    return ok({ steps, done, total: onboardingSteps.length });
  });
}
