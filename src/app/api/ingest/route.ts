import type { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "~/lib/env";
import { handleIngest } from "~/server/api/ingest/handle";
import {
  DEFAULT_INGEST_RATE_LIMIT,
  getIngestRateLimitStore,
} from "~/server/auth/rate-limit";
import { runHandler } from "~/server/effect/runtime";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const env = getServerEnv();
  return runHandler(
    handleIngest({
      req,
      expectedToken: env.INGEST_TOKEN,
      rateLimitStore: getIngestRateLimitStore(),
      rateLimitConfig: DEFAULT_INGEST_RATE_LIMIT,
    }),
  );
}
