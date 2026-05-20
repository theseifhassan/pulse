import "server-only";

import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "~/server/api/http";
import { requireIngestToken } from "~/server/auth/ingest-token";
import {
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitStore,
} from "~/server/auth/rate-limit";
import { feedItems } from "~/server/db/schema";
import { Database } from "~/server/effect/database";
import {
  type AppError,
  ConflictError,
  DatabaseError,
} from "~/server/effect/errors";

export const IngestRequest = z.object({
  title: z.string().min(1, "title is required"),
  sourceUrl: z.string().url("sourceUrl must be a valid URL"),
  sourceName: z.string().min(1, "sourceName is required"),
  mediaUrl: z
    .string()
    .url("mediaUrl must be a valid URL")
    .nullable()
    .optional(),
  body: z.string().min(1, "body is required"),
});

export type IngestRequestT = z.infer<typeof IngestRequest>;

export interface IngestDeps {
  readonly req: Request;
  readonly expectedToken: string;
  readonly rateLimitStore: RateLimitStore;
  readonly rateLimitConfig: RateLimitConfig;
}

function isUniqueViolation(cause: unknown): boolean {
  if (!cause || typeof cause !== "object") return false;
  const c = cause as { code?: unknown; message?: unknown };
  if (c.code === "23505") return true;
  return (
    typeof c.message === "string" &&
    /duplicate key|source_url|unique/i.test(c.message)
  );
}

export function handleIngest({
  req,
  expectedToken,
  rateLimitStore,
  rateLimitConfig,
}: IngestDeps): Effect.Effect<NextResponse, AppError, Database> {
  return Effect.gen(function* () {
    const token = yield* requireIngestToken({
      authHeader: req.headers.get("authorization"),
      expectedToken,
    });
    yield* checkRateLimit(rateLimitStore, token, rateLimitConfig);
    const input = yield* parseJsonBody(req, IngestRequest);
    const db = yield* Database;

    const inserted = yield* Effect.tryPromise({
      try: () =>
        db
          .insert(feedItems)
          .values({
            title: input.title,
            sourceUrl: input.sourceUrl,
            sourceName: input.sourceName,
            mediaUrl: input.mediaUrl ?? null,
            body: input.body,
          })
          .returning({ id: feedItems.id }),
      catch: (cause): AppError => {
        if (isUniqueViolation(cause)) {
          return new ConflictError({
            resource: "feed_item",
            reason: "source_url already exists",
          });
        }
        return new DatabaseError({ cause });
      },
    }).pipe(
      Effect.catchTag("ConflictError", (e) =>
        // Enrich with existingId so callers can dedup deterministically.
        Effect.gen(function* () {
          const existing = yield* Effect.tryPromise({
            try: () =>
              db
                .select({ id: feedItems.id })
                .from(feedItems)
                .where(eq(feedItems.sourceUrl, input.sourceUrl))
                .limit(1),
            catch: (cause): AppError => new DatabaseError({ cause }),
          });
          return yield* new ConflictError({
            resource: e.resource,
            reason: e.reason,
            existingId: existing[0]?.id,
          });
        }),
      ),
    );

    return NextResponse.json({ id: inserted[0].id }, { status: 201 });
  });
}
