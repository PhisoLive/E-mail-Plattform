import { senderProfiles, workspaces } from "@ep/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { writeAudit } from "../audit";
import type { WorkspaceContext } from "../context";
import { appError } from "../errors";
import { can, requirePermission } from "../permissions";
import { err, ok, type Result } from "../result";
import { withWorkspace } from "../scope";
import {
  isLegalForm,
  isSenderProfileComplete,
  type NormalizedSenderProfile,
  optionalSenderFields,
  requiredSenderFields,
  type SenderField,
  type SenderProfileData,
  validateSenderProfile,
  type WorkspaceCountry,
  type WorkspaceKind,
} from "../sender/legal-forms";

const text = (max: number) => z.string().max(max).nullish();

/** Transport shape of the form; the rules per legal form are checked in validateSenderProfile. */
export const senderProfileInput = z.object({
  legalForm: text(40),
  companyName: text(400),
  address: z
    .object({
      street: text(400),
      postalCode: text(40),
      city: text(400),
      country: text(4),
    })
    .nullish(),
  seat: text(240),
  registerCourt: text(400),
  registerNumber: text(100),
  managingDirectors: text(1000),
  supervisoryBoardChair: text(400),
  generalPartner: z
    .object({
      name: text(400),
      seat: text(240),
      registerCourt: text(240),
      registerNumber: text(100),
    })
    .nullish(),
  vatId: text(60),
  phone: text(60),
  website: text(4000),
  privacyUrl: text(4000),
});

export interface SenderProfileView {
  profile: NormalizedSenderProfile;
  workspace: { kind: WorkspaceKind; country: WorkspaceCountry };
  required: SenderField[];
  optional: SenderField[];
  complete: boolean;
  /** Rights of the requesting member in the workspace this profile belongs to. */
  canEdit: boolean;
}

type ProfileRow = typeof senderProfiles.$inferSelect;

function toProfile(
  row: ProfileRow | undefined,
  country: WorkspaceCountry,
): NormalizedSenderProfile {
  return {
    legalForm: isLegalForm(row?.legalForm) ? row.legalForm : null,
    companyName: row?.companyName ?? null,
    address: {
      street: row?.address?.street ?? null,
      postalCode: row?.address?.postalCode ?? null,
      city: row?.address?.city ?? null,
      country: row?.address?.country ?? (country === "other" ? "DE" : country),
    },
    seat: row?.seat ?? null,
    registerCourt: row?.registerCourt ?? null,
    registerNumber: row?.registerNumber ?? null,
    managingDirectors: row?.managingDirectors ?? null,
    supervisoryBoardChair: row?.supervisoryBoardChair ?? null,
    generalPartner: row?.generalPartner ?? null,
    vatId: row?.vatId ?? null,
    phone: row?.phone ?? null,
    website: row?.website ?? null,
    privacyUrl: row?.privacyUrl ?? null,
  };
}

/** Sender profile with the mandatory fields of its legal form (concept chapters 7, 17). */
export async function getSenderProfile(ctx: WorkspaceContext): Promise<Result<SenderProfileView>> {
  const permission = requirePermission(ctx.role, "workspace.view");
  if (!permission.ok) return permission;
  return withWorkspace(ctx, async (scope) => {
    const [workspace] = await scope.tx
      .select({ kind: workspaces.kind, country: workspaces.country })
      .from(workspaces)
      .where(eq(workspaces.id, scope.workspaceId));
    if (!workspace) return err(appError("NOT_FOUND"));
    const [row] = await scope.tx
      .select()
      .from(senderProfiles)
      .where(eq(senderProfiles.workspaceId, scope.workspaceId));
    const profile = toProfile(row, workspace.country);
    const context = { kind: workspace.kind, country: profile.address.country };
    return ok({
      profile,
      workspace,
      required: requiredSenderFields(profile.legalForm, context),
      optional: optionalSenderFields(profile.legalForm, context),
      complete: isSenderProfileComplete(profile, workspace),
      canEdit: can(ctx.role, "settings.manage"),
    });
  });
}

/**
 * Saves the sender profile. All mandatory details of the chosen legal form must be filled –
 * they are attached to every business e-mail and shown on the unsubscribe page.
 */
export async function updateSenderProfile(
  ctx: WorkspaceContext,
  input: SenderProfileData,
): Promise<Result<{ complete: true }>> {
  const permission = requirePermission(ctx.role, "settings.manage");
  if (!permission.ok) return permission;
  return withWorkspace(ctx, async (scope) => {
    const [workspace] = await scope.tx
      .select({ kind: workspaces.kind, country: workspaces.country })
      .from(workspaces)
      .where(eq(workspaces.id, scope.workspaceId));
    if (!workspace) return err(appError("NOT_FOUND"));
    const validated = validateSenderProfile(input, workspace);
    if (!validated.ok) return validated;
    const profile = validated.value;
    const values = {
      legalForm: profile.legalForm,
      companyName: profile.companyName,
      address: profile.address,
      seat: profile.seat,
      registerCourt: profile.registerCourt,
      registerNumber: profile.registerNumber,
      managingDirectors: profile.managingDirectors,
      supervisoryBoardChair: profile.supervisoryBoardChair,
      generalPartner: profile.generalPartner,
      vatId: profile.vatId,
      phone: profile.phone,
      website: profile.website,
      privacyUrl: profile.privacyUrl,
    };
    const [row] = await scope.tx
      .insert(senderProfiles)
      .values({ workspaceId: scope.workspaceId, ...values })
      .onConflictDoUpdate({
        target: senderProfiles.workspaceId,
        set: { ...values, updatedAt: ctx.deps.clock.now() },
      })
      .returning({ id: senderProfiles.id });
    await writeAudit(scope, {
      action: "sender_profile.updated",
      objectType: "sender_profile",
      ...(row ? { objectId: row.id } : {}),
      data: {
        legalForm: profile.legalForm,
        fields: Object.entries(values)
          .filter(([, value]) => value !== null)
          .map(([key]) => key),
      },
    });
    return ok({ complete: true as const });
  });
}
