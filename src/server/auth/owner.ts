import { Effect } from "effect";
import { ForbiddenError, UnauthorizedError } from "~/server/effect/errors";

export interface OwnerCheckInput {
  readonly userId: string | null | undefined;
  readonly ownerUserId: string;
}

export function requireOwner({
  userId,
  ownerUserId,
}: OwnerCheckInput): Effect.Effect<string, UnauthorizedError | ForbiddenError> {
  if (!userId) {
    return Effect.fail(new UnauthorizedError({ reason: "not authenticated" }));
  }
  if (userId !== ownerUserId) {
    // authenticated but not authorized → 403
    return Effect.fail(new ForbiddenError({ reason: "not the owner" }));
  }
  return Effect.succeed(userId);
}
