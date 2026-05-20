import "server-only";

import { Effect, type Layer, ManagedRuntime } from "effect";
import type { NextResponse } from "next/server";
import { type Database, DatabaseLive } from "~/server/effect/database";
import { type AppError, errorToResponse } from "~/server/effect/errors";

export const AppLayer: Layer.Layer<Database, never, never> = DatabaseLive;

export type AppRuntime = ManagedRuntime.ManagedRuntime<Database, never>;

let cachedRuntime: AppRuntime | undefined;
let shutdownRegistered = false;

function registerShutdownOnce(runtime: AppRuntime): void {
  if (shutdownRegistered) return;
  shutdownRegistered = true;
  // Best-effort: dispose the runtime (which finalizes Layer scopes — closing
  // the Postgres pool, draining background fibers) on process termination.
  // Next.js dev re-evaluates modules but the underlying process persists, so
  // the handler only fires on real shutdowns.
  if (typeof process === "undefined") return;
  const dispose = () => {
    void runtime.dispose();
  };
  process.once("SIGINT", dispose);
  process.once("SIGTERM", dispose);
  process.once("beforeExit", dispose);
}

export function getAppRuntime(): AppRuntime {
  if (!cachedRuntime) {
    cachedRuntime = ManagedRuntime.make(AppLayer);
    registerShutdownOnce(cachedRuntime);
  }
  return cachedRuntime;
}

// Tag-dispatched error handling per the Effect v4 idiom (`catchTags` rather
// than `catch` + switch). Each branch produces a NextResponse so the resulting
// Effect has no error channel and can be run directly.
export const runHandlerWith =
  (runtime: AppRuntime) =>
  (
    effect: Effect.Effect<NextResponse, AppError, Database>,
  ): Promise<NextResponse> =>
    runtime.runPromise(
      Effect.catchTags(effect, {
        NotFoundError: (e) => Effect.succeed(errorToResponse(e)),
        ConflictError: (e) => Effect.succeed(errorToResponse(e)),
        UnauthorizedError: (e) => Effect.succeed(errorToResponse(e)),
        ForbiddenError: (e) => Effect.succeed(errorToResponse(e)),
        RateLimitedError: (e) => Effect.succeed(errorToResponse(e)),
        ValidationError: (e) => Effect.succeed(errorToResponse(e)),
        DatabaseError: (e) => Effect.succeed(errorToResponse(e)),
      }),
    );

export const runHandler = (
  effect: Effect.Effect<NextResponse, AppError, Database>,
): Promise<NextResponse> => runHandlerWith(getAppRuntime())(effect);
