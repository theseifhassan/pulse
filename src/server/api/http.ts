import "server-only";

import { Effect } from "effect";
import type { z } from "zod";
import { type AppError, ValidationError } from "~/server/effect/errors";

export function parseJsonBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Effect.Effect<T, AppError> {
  return Effect.gen(function* () {
    const raw = yield* Effect.tryPromise({
      try: () => req.json(),
      catch: () =>
        new ValidationError({ issues: ["request body is not valid JSON"] }),
    });
    const result = schema.safeParse(raw);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => {
        const path = issue.path.join(".") || "(root)";
        return `${path}: ${issue.message}`;
      });
      return yield* new ValidationError({ issues });
    }
    return result.data;
  });
}

export function parseQuery<T>(
  url: URL,
  schema: z.ZodType<T>,
): Effect.Effect<T, AppError> {
  return Effect.gen(function* () {
    const raw: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    const result = schema.safeParse(raw);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => {
        const path = issue.path.join(".") || "(root)";
        return `${path}: ${issue.message}`;
      });
      return yield* new ValidationError({ issues });
    }
    return result.data;
  });
}
