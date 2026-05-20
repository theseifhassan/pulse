import { auth } from "@clerk/nextjs/server";
import type { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "~/lib/env";
import { handleFeedback } from "~/server/api/feed/feedback";
import { runHandler } from "~/server/effect/runtime";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const env = getServerEnv();
  const { userId } = await auth();
  const { id } = await params;
  return runHandler(
    handleFeedback({
      req,
      itemId: id,
      auth: { userId },
      ownerUserId: env.ALLOWED_OWNER_USER_ID,
    }),
  );
}
