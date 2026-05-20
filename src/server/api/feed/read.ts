import "server-only";

import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import { z } from "zod";
import { type AuthInput, requireAuthedOwner } from "~/server/api/auth-input";
import { parseJsonBody } from "~/server/api/http";
import { feedItems } from "~/server/db/schema";
import { Database } from "~/server/effect/database";
import {
  type AppError,
  DatabaseError,
  NotFoundError,
} from "~/server/effect/errors";

export const ReadToggleRequest = z.object({
  read: z.boolean(),
});

export interface ReadToggleDeps {
  readonly req: Request;
  readonly itemId: string;
  readonly auth: AuthInput;
  readonly ownerUserId: string;
}

export function handleReadToggle({
  req,
  itemId,
  auth,
  ownerUserId,
}: ReadToggleDeps): Effect.Effect<NextResponse, AppError, Database> {
  return Effect.gen(function* () {
    yield* requireAuthedOwner(auth, ownerUserId);
    const input = yield* parseJsonBody(req, ReadToggleRequest);
    const db = yield* Database;

    const updated = yield* Effect.tryPromise({
      try: () =>
        db
          .update(feedItems)
          .set({ readAt: input.read ? new Date() : null })
          .where(eq(feedItems.id, itemId))
          .returning(),
      catch: (cause): AppError => new DatabaseError({ cause }),
    });

    if (updated.length === 0) {
      return yield* new NotFoundError({ resource: "feed_item", id: itemId });
    }

    const row = updated[0];
    return NextResponse.json({
      id: row.id,
      readAt: row.readAt ? row.readAt.toISOString() : null,
    });
  });
}
