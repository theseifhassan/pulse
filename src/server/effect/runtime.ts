import { Effect, type Layer, ManagedRuntime } from "effect";
import type { NextResponse } from "next/server";
import { type Database, DatabaseLive } from "~/server/effect/database";
import { type AppError, errorToResponse } from "~/server/effect/errors";

export const AppLayer: Layer.Layer<Database, never, never> = DatabaseLive;

export type AppRuntime = ManagedRuntime.ManagedRuntime<Database, never>;

let cachedRuntime: AppRuntime | undefined;

export function getAppRuntime(): AppRuntime {
  if (!cachedRuntime) {
    cachedRuntime = ManagedRuntime.make(AppLayer);
  }
  return cachedRuntime;
}

export const runHandlerWith =
  (runtime: AppRuntime) =>
  (
    effect: Effect.Effect<NextResponse, AppError, Database>,
  ): Promise<NextResponse> =>
    runtime.runPromise(
      Effect.catch(effect, (error) => Effect.succeed(errorToResponse(error))),
    );

export const runHandler = (
  effect: Effect.Effect<NextResponse, AppError, Database>,
): Promise<NextResponse> => runHandlerWith(getAppRuntime())(effect);
