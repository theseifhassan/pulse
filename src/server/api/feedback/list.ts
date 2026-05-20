import "server-only";

import { eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import { requireIngestToken } from "~/server/auth/ingest-token";
import {
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitStore,
} from "~/server/auth/rate-limit";
import type { Database as DrizzleDb } from "~/server/db";
import { feedback, feedItems } from "~/server/db/schema";
import { Database } from "~/server/effect/database";
import { type AppError, DatabaseError } from "~/server/effect/errors";

export interface FeedbackListDeps {
  readonly req: Request;
  readonly expectedToken: string;
  readonly rateLimitStore: RateLimitStore;
  readonly rateLimitConfig: RateLimitConfig;
}

export interface FeedbackDto {
  readonly feedItemId: string;
  readonly sourceUrl: string;
  readonly vote: "up" | "down" | null;
  readonly updatedAt: string;
}

export interface FeedbackResponse {
  readonly items: readonly FeedbackDto[];
}

export async function fetchAllFeedback(
  db: DrizzleDb,
): Promise<FeedbackResponse> {
  const rows = await db
    .select({
      feedItemId: feedback.feedItemId,
      sourceUrl: feedItems.sourceUrl,
      vote: feedback.vote,
      updatedAt: feedback.updatedAt,
    })
    .from(feedback)
    .innerJoin(feedItems, eq(feedItems.id, feedback.feedItemId))
    .orderBy(sql`${feedback.updatedAt} DESC, ${feedback.feedItemId} DESC`);
  return {
    items: rows.map((r) => ({
      feedItemId: r.feedItemId,
      sourceUrl: r.sourceUrl,
      vote: r.vote,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

export function handleFeedbackList({
  req,
  expectedToken,
  rateLimitStore,
  rateLimitConfig,
}: FeedbackListDeps): Effect.Effect<NextResponse, AppError, Database> {
  return Effect.gen(function* () {
    const token = yield* requireIngestToken({
      authHeader: req.headers.get("authorization"),
      expectedToken,
    });
    yield* checkRateLimit(rateLimitStore, token, rateLimitConfig);
    const db = yield* Database;
    const body = yield* Effect.tryPromise({
      try: () => fetchAllFeedback(db),
      catch: (cause): AppError => new DatabaseError({ cause }),
    });
    return NextResponse.json(body);
  });
}
