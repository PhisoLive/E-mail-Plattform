import { type AppError, AppErrorException, type ErrorCode } from "@ep/core";
import { TRPCError } from "@trpc/server";

type TrpcCode = ConstructorParameters<typeof TRPCError>[0]["code"];

const codeMap: Partial<Record<ErrorCode, TrpcCode>> = {
  VALIDATION: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  UNAUTHENTICATED: "UNAUTHORIZED",
  CONFLICT: "CONFLICT",
  STATE_CHANGED: "CONFLICT",
  RATE_LIMITED: "TOO_MANY_REQUESTS",
  TWO_FACTOR_REQUIRED: "FORBIDDEN",
  FRESH_LOGIN_REQUIRED: "FORBIDDEN",
  INTERNAL: "INTERNAL_SERVER_ERROR",
};

/** Converts a domain error into a tRPC error. The UI maps `appError.code` to a text from de.json. */
export function toTrpcError(error: AppError): TRPCError {
  return new TRPCError({
    code: codeMap[error.code] ?? "BAD_REQUEST",
    message: error.code,
    cause: new AppErrorException(error),
  });
}

/** Unwraps a Result inside a procedure. */
export function unwrapResult<T>(
  result: { ok: true; value: T } | { ok: false; error: AppError },
): T {
  if (result.ok) return result.value;
  throw toTrpcError(result.error);
}
