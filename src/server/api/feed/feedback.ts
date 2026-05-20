import "server-only";

import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import { z } from "zod";
import { type AuthInput, requireAuthedOwner } from "~/server/api/auth-input";
import { parseJsonBody } from "~/server/api/http";
import { feedback, feedItems } from "~/server/db/schema";
import { Database } from "~/server/effect/database";
import {
  type AppError,
  DatabaseError,
  NotFoundError,
} from "~/server/effect/errors";

export const FeedbackRequest = z.object({
  vote: z.enum(["up", "down"]).nullable(),
  reasoning: z.string().nullable().optional(),
});

export type FeedbackRequestT = z.infer<typeof FeedbackRequest>;

export interface FeedbackDeps {
  readonly req: Request;
  readonly itemId: string;
  readonly auth: AuthInput;
  readonly ownerUserId: string;
}

export function handleFeedback({
  req,
  itemId,
  auth,
  ownerUserId,
}: FeedbackDeps): Effect.Effect<NextResponse, AppError, Database> {
  return Effect.gen(function* () {
    yield* requireAuthedOwner(auth, ownerUserId);
    const input = yield* parseJsonBody(req, FeedbackRequest);
    const db = yield* Database;

    // 404 fast if the item doesn't exist, so foreign-key violation doesn't
    // surface as a generic 500.
    const exists = yield* Effect.tryPromise({
      try: () =>
        db
          .select({ id: feedItems.id })
          .from(feedItems)
          .where(eq(feedItems.id, itemId))
          .limit(1),
      catch: (cause): AppError => new DatabaseError({ cause }),
    });
    if (exists.length === 0) {
      return yield* new NotFoundError({ resource: "feed_item", id: itemId });
    }

    const now = new Date();
    const reasoning = input.reasoning ?? null;
    const upserted = yield* Effect.tryPromise({
      try: () =>
        db
          .insert(feedback)
          .values({
            feedItemId: itemId,
            vote: input.vote,
            reasoning,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: feedback.feedItemId,
            set: { vote: input.vote, reasoning, updatedAt: now },
          })
          .returning(),
      catch: (cause): AppError => new DatabaseError({ cause }),
    });

    const row = upserted[0];
    return NextResponse.json({
      feedItemId: row.feedItemId,
      vote: row.vote,
      reasoning: row.reasoning,
      updatedAt: row.updatedAt.toISOString(),
    });
  });
}
