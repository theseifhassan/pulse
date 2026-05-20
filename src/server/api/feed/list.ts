import "server-only";

import { isNotNull, isNull, sql } from "drizzle-orm";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import { z } from "zod";
import { type AuthInput, requireAuthedOwner } from "~/server/api/auth-input";
import {
  type Cursor,
  DEFAULT_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  MAX_PAGE_SIZE,
} from "~/server/api/cursor";
import { parseQuery } from "~/server/api/http";
import { feedItems } from "~/server/db/schema";
import { Database } from "~/server/effect/database";
import {
  type AppError,
  DatabaseError,
  ValidationError,
} from "~/server/effect/errors";

export const FeedListQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

export type FeedListQueryT = z.infer<typeof FeedListQuery>;

export type FeedListVariant = "unread" | "history";

export interface FeedListDeps {
  readonly url: URL;
  readonly auth: AuthInput;
  readonly ownerUserId: string;
  readonly variant: FeedListVariant;
}

export interface FeedItemDto {
  readonly id: string;
  readonly title: string;
  readonly sourceUrl: string;
  readonly sourceName: string;
  readonly mediaUrl: string | null;
  readonly body: string;
  readonly createdAt: string;
  readonly readAt: string | null;
}

interface FeedListBody {
  readonly items: readonly FeedItemDto[];
  readonly nextCursor: string | null;
}

function toDto(row: typeof feedItems.$inferSelect): FeedItemDto {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    mediaUrl: row.mediaUrl,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
  };
}

export function handleFeedList({
  url,
  auth,
  ownerUserId,
  variant,
}: FeedListDeps): Effect.Effect<NextResponse, AppError, Database> {
  return Effect.gen(function* () {
    yield* requireAuthedOwner(auth, ownerUserId);
    const query = yield* parseQuery(url, FeedListQuery);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    let cursor: Cursor | null = null;
    if (query.cursor !== undefined) {
      cursor = decodeCursor(query.cursor);
      if (!cursor) {
        return yield* new ValidationError({ issues: ["invalid cursor"] });
      }
    }

    const db = yield* Database;

    // Branch on variant. Unread is sorted by created_at DESC, id DESC; history
    // by read_at DESC, id DESC. Both use keyset tuple comparison for the
    // cursor: `(ts_col, id) < (cursor.ts, cursor.id)`.
    const rows = yield* Effect.tryPromise({
      try: () => {
        if (variant === "unread") {
          const whereClause = cursor
            ? sql`${feedItems.readAt} IS NULL AND (${feedItems.createdAt}, ${feedItems.id}) < (${cursor.ts}::timestamptz, ${cursor.id}::uuid)`
            : isNull(feedItems.readAt);
          return db
            .select()
            .from(feedItems)
            .where(whereClause)
            .orderBy(sql`${feedItems.createdAt} DESC, ${feedItems.id} DESC`)
            .limit(limit + 1);
        }
        const whereClause = cursor
          ? sql`${feedItems.readAt} IS NOT NULL AND (${feedItems.readAt}, ${feedItems.id}) < (${cursor.ts}::timestamptz, ${cursor.id}::uuid)`
          : isNotNull(feedItems.readAt);
        return db
          .select()
          .from(feedItems)
          .where(whereClause)
          .orderBy(sql`${feedItems.readAt} DESC, ${feedItems.id} DESC`)
          .limit(limit + 1);
      },
      catch: (cause): AppError => new DatabaseError({ cause }),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    let nextCursor: string | null = null;
    if (hasMore) {
      const last = page[page.length - 1];
      const cursorTs =
        variant === "unread" ? last.createdAt : (last.readAt as Date);
      nextCursor = encodeCursor({
        ts: cursorTs.toISOString(),
        id: last.id,
      });
    }

    const body: FeedListBody = {
      items: page.map(toDto),
      nextCursor,
    };
    return NextResponse.json(body);
  });
}
