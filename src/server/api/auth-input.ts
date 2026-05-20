import "server-only";

import type { Effect } from "effect";
import { requireOwner } from "~/server/auth/owner";
import type { ForbiddenError, UnauthorizedError } from "~/server/effect/errors";

export interface AuthInput {
  readonly userId: string | null;
}

export function requireAuthedOwner(
  auth: AuthInput,
  ownerUserId: string,
): Effect.Effect<string, UnauthorizedError | ForbiddenError> {
  return requireOwner({ userId: auth.userId, ownerUserId });
}
