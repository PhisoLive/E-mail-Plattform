import { defaults } from "@ep/config/defaults";
import { senderProfiles, user, workspaceMembers, workspaces } from "@ep/db";
import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { writeAudit, writeUserAudit } from "../audit";
import type { MemberRole, UserContext, WorkspaceContext } from "../context";
import { randomToken } from "../crypto-utils";
import { appError } from "../errors";
import { requirePermission } from "../permissions";
import { err, ok, type Result } from "../result";
import { withUser, withWorkspace } from "../scope";
import { slugify } from "../slug";

const countryDefaults = {
  DE: { timezone: "Europe/Berlin", language: "de-DE" },
  AT: { timezone: "Europe/Vienna", language: "de-AT" },
  CH: { timezone: "Europe/Zurich", language: "de-CH" },
  other: { timezone: defaults.workspace.timezone, language: defaults.workspace.defaultLanguage },
} as const;

export const createWorkspaceInput = z.object({
  name: z
    .string()
    .trim()
    .min(defaults.workspace.nameMinLength)
    .max(defaults.workspace.nameMaxLength),
  kind: z.enum(["business", "private"]).default("business"),
  country: z.enum(["DE", "AT", "CH", "other"]).default("DE"),
});
export type CreateWorkspaceInput = z.input<typeof createWorkspaceInput>;

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: MemberRole;
  trustLevel: string;
  /** IANA time zone; dates in the interface follow it. */
  timezone: string;
}

export async function createWorkspace(
  ctx: UserContext,
  rawInput: CreateWorkspaceInput,
): Promise<Result<WorkspaceSummary>> {
  const parsed = createWorkspaceInput.safeParse(rawInput);
  if (!parsed.success) return err(appError("VALIDATION"));
  if (!ctx.emailVerified) return err(appError("EMAIL_NOT_VERIFIED"));
  const input = parsed.data;
  const regional = countryDefaults[input.country];

  return withUser(ctx, async (scope) => {
    const base = slugify(input.name);
    let workspace: typeof workspaces.$inferSelect | undefined;
    // Insert with ON CONFLICT so two parallel requests with the same name cannot collide.
    for (let attempt = 0; attempt < 8 && !workspace; attempt++) {
      const slug =
        attempt === 0
          ? base
          : `${base}-${randomToken(3)
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "x")}`;
      [workspace] = await scope.tx
        .insert(workspaces)
        .values({
          name: input.name,
          slug,
          kind: input.kind,
          country: input.country,
          timezone: regional.timezone,
          defaultLanguage: regional.language,
        })
        .onConflictDoNothing({ target: workspaces.slug })
        .returning();
    }
    if (!workspace) return err(appError("INTERNAL"));
    await scope.tx
      .insert(workspaceMembers)
      .values({ workspaceId: workspace.id, userId: scope.userId, role: "owner" });
    await scope.tx.insert(senderProfiles).values({
      workspaceId: workspace.id,
      companyName: input.kind === "business" ? input.name : null,
    });
    await writeUserAudit(scope, workspace.id, {
      action: "workspace.created",
      objectType: "workspace",
      objectId: workspace.id,
      data: { kind: input.kind, country: input.country },
    });
    return ok({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: "owner",
      trustLevel: workspace.trustLevel,
      timezone: workspace.timezone,
    });
  });
}

/** Workspaces of the signed-in user (only their own memberships). */
export async function listMyWorkspaces(ctx: UserContext): Promise<WorkspaceSummary[]> {
  return withUser(ctx, async (scope) => {
    const rows = await scope.tx
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        role: workspaceMembers.role,
        trustLevel: workspaces.trustLevel,
        timezone: workspaces.timezone,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(and(eq(workspaceMembers.userId, scope.userId), isNull(workspaces.deletedAt)))
      .orderBy(asc(workspaces.name));
    return rows;
  });
}

/** Role of the signed-in user in a workspace, or null. Used to build the WorkspaceContext. */
export async function getMembershipRole(
  ctx: UserContext,
  workspaceId: string,
): Promise<MemberRole | null> {
  return withUser(ctx, async (scope) => {
    const [row] = await scope.tx
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, scope.userId),
          eq(workspaceMembers.workspaceId, workspaceId),
          isNull(workspaces.deletedAt),
        ),
      );
    return row?.role ?? null;
  });
}

export interface WorkspaceDetails {
  id: string;
  name: string;
  slug: string;
  kind: "business" | "private";
  country: "DE" | "AT" | "CH" | "other";
  timezone: string;
  defaultLanguage: string;
  defaultFormality: "sie" | "du" | "auto";
  trustLevel: string;
  role: MemberRole;
}

export async function getWorkspace(ctx: WorkspaceContext): Promise<Result<WorkspaceDetails>> {
  return withWorkspace(ctx, async (scope) => {
    const [row] = await scope.tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, scope.workspaceId));
    if (!row) return err(appError("NOT_FOUND"));
    return ok({
      id: row.id,
      name: row.name,
      slug: row.slug,
      kind: row.kind,
      country: row.country,
      timezone: row.timezone,
      defaultLanguage: row.defaultLanguage,
      defaultFormality: row.defaultFormality,
      trustLevel: row.trustLevel,
      role: ctx.role,
    });
  });
}

export const updateWorkspaceInput = z.object({
  name: z
    .string()
    .trim()
    .min(defaults.workspace.nameMinLength)
    .max(defaults.workspace.nameMaxLength)
    .optional(),
  timezone: z.string().min(3).max(64).optional(),
  defaultFormality: z.enum(["sie", "du"]).optional(),
  defaultLanguage: z.enum(["de-DE", "de-AT", "de-CH", "en"]).optional(),
});

export async function updateWorkspace(
  ctx: WorkspaceContext,
  rawInput: z.input<typeof updateWorkspaceInput>,
): Promise<Result<true>> {
  const permission = requirePermission(ctx.role, "settings.manage");
  if (!permission.ok) return permission;
  const parsed = updateWorkspaceInput.safeParse(rawInput);
  if (!parsed.success) return err(appError("VALIDATION"));
  if (parsed.data.timezone && !Intl.supportedValuesOf("timeZone").includes(parsed.data.timezone)) {
    return err(appError("VALIDATION", undefined, { timezone: "invalid" }));
  }
  return withWorkspace(ctx, async (scope) => {
    await scope.tx.update(workspaces).set(parsed.data).where(eq(workspaces.id, scope.workspaceId));
    await writeAudit(scope, {
      action: "workspace.updated",
      objectType: "workspace",
      objectId: scope.workspaceId,
      data: { fields: Object.keys(parsed.data) },
    });
    return ok(true as const);
  });
}

/**
 * Current name, address, 2FA state and platform role of the signed-in user, read fresh from the
 * database. Better Auth caches the user in its session store; rights must not depend on that copy
 * (a revoked platform role takes effect with the next request).
 */
export async function getUserProfile(ctx: UserContext): Promise<{
  name: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  platformRole: string;
} | null> {
  return withUser(ctx, async (scope) => {
    const [row] = await scope.tx
      .select({
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        platformRole: user.platformRole,
      })
      .from(user)
      .where(eq(user.id, scope.userId));
    return row
      ? {
          name: row.name,
          email: row.email,
          emailVerified: row.emailVerified,
          twoFactorEnabled: row.twoFactorEnabled ?? false,
          platformRole: row.platformRole,
        }
      : null;
  });
}
