import { Effect } from "effect";
import { UnauthorizedError } from "~/server/effect/errors";

export interface OwnerCheckInput {
  readonly userId: string | null | undefined;
  readonly ownerUserId: string;
}

export function requireOwner({
  userId,
  ownerUserId,
}: OwnerCheckInput): Effect.Effect<string, UnauthorizedError> {
  if (!userId) {
    return Effect.fail(new UnauthorizedError({ reason: "not authenticated" }));
  }
  if (userId !== ownerUserId) {
    return Effect.fail(new UnauthorizedError({ reason: "not the owner" }));
  }
  return Effect.succeed(userId);
}
