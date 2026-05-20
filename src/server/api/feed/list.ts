import "server-only";

import { eq, isNotNull, isNull, sql } from "drizzle-orm";
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
import type { Database as DrizzleDb } from "~/server/db";
import { feedback, feedItems } from "~/server/db/schema";
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

export type FeedVote = "up" | "down" | null;

export interface FeedItemDto {
  readonly id: string;
  readonly title: string;
  readonly sourceUrl: string;
  readonly sourceName: string;
  readonly summary: string;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly vote: FeedVote;
}

export interface FeedPage {
  readonly items: readonly FeedItemDto[];
  readonly nextCursor: string | null;
}

interface FeedRow {
  readonly id: string;
  readonly title: string;
  readonly sourceUrl: string;
  readonly sourceName: string;
  readonly summary: string;
  readonly createdAt: Date;
  readonly readAt: Date | null;
  readonly vote: FeedVote;
}

function toDto(row: FeedRow): FeedItemDto {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
    vote: row.vote,
  };
}

export interface FetchFeedPageOpts {
  readonly variant: FeedListVariant;
  readonly cursor: Cursor | null;
  readonly limit: number;
}

// Pure data fetch — shared between the HTTP handler (handleFeedList) and any
// Server Component that wants to render the same page server-side.
export async function fetchFeedPage(
  db: DrizzleDb,
  { variant, cursor, limit }: FetchFeedPageOpts,
): Promise<FeedPage> {
  // Left-join feedback so archived items can render their LIKED/DIDN'T badge
  // after a reload (otherwise the badge only sticks for the in-memory session).
  const baseSelect = {
    id: feedItems.id,
    title: feedItems.title,
    sourceUrl: feedItems.sourceUrl,
    sourceName: feedItems.sourceName,
    summary: feedItems.summary,
    createdAt: feedItems.createdAt,
    readAt: feedItems.readAt,
    vote: feedback.vote,
  };
  let rows: FeedRow[];
  if (variant === "unread") {
    const whereClause = cursor
      ? sql`${feedItems.readAt} IS NULL AND (${feedItems.createdAt}, ${feedItems.id}) < (${cursor.ts}::timestamptz, ${cursor.id}::uuid)`
      : isNull(feedItems.readAt);
    rows = await db
      .select(baseSelect)
      .from(feedItems)
      .leftJoin(feedback, eq(feedback.feedItemId, feedItems.id))
      .where(whereClause)
      .orderBy(sql`${feedItems.createdAt} DESC, ${feedItems.id} DESC`)
      .limit(limit + 1);
  } else {
    const whereClause = cursor
      ? sql`${feedItems.readAt} IS NOT NULL AND (${feedItems.readAt}, ${feedItems.id}) < (${cursor.ts}::timestamptz, ${cursor.id}::uuid)`
      : isNotNull(feedItems.readAt);
    rows = await db
      .select(baseSelect)
      .from(feedItems)
      .leftJoin(feedback, eq(feedback.feedItemId, feedItems.id))
      .where(whereClause)
      .orderBy(sql`${feedItems.readAt} DESC, ${feedItems.id} DESC`)
      .limit(limit + 1);
  }

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

  return { items: page.map(toDto), nextCursor };
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

    const page = yield* Effect.tryPromise({
      try: () => fetchFeedPage(db, { variant, cursor, limit }),
      catch: (cause): AppError => new DatabaseError({ cause }),
    });

    return NextResponse.json(page);
  });
}
