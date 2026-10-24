import type { AppError } from "./errors";

/** Typed result of domain logic (concept chapter 3). Exceptions only at system boundaries. */
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/** Unwraps a result at a system boundary; throws the AppError otherwise. */
export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw new AppErrorException(result.error);
}

export class AppErrorException extends Error {
  constructor(public readonly appError: AppError) {
    super(appError.code);
    this.name = "AppErrorException";
  }
}
