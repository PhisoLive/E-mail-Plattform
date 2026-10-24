import { defaults } from "@ep/config/defaults";
import {
  AppErrorException,
  appError,
  type MemberRole,
  type UserContext,
  type WorkspaceContext,
  workspaceContext,
  workspaceService,
} from "@ep/core";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { TrpcContext } from "./context";
import { toTrpcError } from "./errors";

export interface ProcedureMeta {
  /** Owners and admins may use this procedure before setting up 2FA (e.g. to set it up). */
  allowWithoutTwoFactor?: boolean;
}

const t = initTRPC
  .context<TrpcContext>()
  .meta<ProcedureMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      const cause = error.cause;
      const app = cause instanceof AppErrorException ? cause.appError : null;
      return {
        ...shape,
        message: app
          ? app.code
          : error.code === "INTERNAL_SERVER_ERROR"
            ? "INTERNAL"
            : shape.message,
        data: {
          code: shape.data.code,
          httpStatus: shape.data.httpStatus,
          appError: app ?? (error.code === "BAD_REQUEST" ? { code: "VALIDATION" as const } : null),
        },
      };
    },
  });

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

/** Signed-in user, independent of a workspace. */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw toTrpcError(appError("UNAUTHENTICATED"));
  const userCtx: UserContext = {
    kind: "user",
    deps: ctx.deps,
    userId: ctx.session.userId,
    email: ctx.session.email,
    emailVerified: ctx.session.emailVerified,
    ...(ctx.ipHash ? { ipHash: ctx.ipHash } : {}),
  };
  return next({ ctx: { ...ctx, session: ctx.session, userCtx } });
});

const twoFactorRoles = defaults.auth.require2faRoles as readonly string[];

/**
 * Procedure inside the selected workspace: checks membership on every request and builds the
 * WorkspaceContext. Owners and admins need 2FA (concept chapter 16).
 */
export const workspaceProcedure = authedProcedure.use(async ({ ctx, meta, next }) => {
  const workspaceId = ctx.workspaceId;
  if (!workspaceId || !z.uuid().safeParse(workspaceId).success)
    throw toTrpcError(appError("FORBIDDEN"));
  const role: MemberRole | null = await workspaceService.getMembershipRole(
    ctx.deps,
    ctx.session.userId,
    workspaceId,
  );
  if (!role) throw toTrpcError(appError("FORBIDDEN"));
  if (
    twoFactorRoles.includes(role) &&
    !ctx.session.twoFactorEnabled &&
    !meta?.allowWithoutTwoFactor
  ) {
    throw toTrpcError(appError("TWO_FACTOR_REQUIRED"));
  }
  const ws: WorkspaceContext = workspaceContext(
    ctx.deps,
    workspaceId,
    { type: "user", id: ctx.session.userId },
    role,
    ctx.ipHash,
  );
  return next({ ctx: { ...ctx, ws } });
});

/** Sensitive actions need a sign-in within the last 15 minutes (concept chapter 16). */
export const freshWorkspaceProcedure = workspaceProcedure.use(({ ctx, next }) => {
  const maxAge = defaults.auth.freshLoginMinutes * 60_000;
  if (ctx.deps.clock.now().getTime() - ctx.session.signedInAt.getTime() > maxAge) {
    throw toTrpcError(appError("FRESH_LOGIN_REQUIRED"));
  }
  return next();
});
