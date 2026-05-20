import { auth } from "@clerk/nextjs/server";
import type { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "~/lib/env";
import { handleFeedList } from "~/server/api/feed/list";
import { runHandler } from "~/server/effect/runtime";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const env = getServerEnv();
  const { userId } = await auth();
  return runHandler(
    handleFeedList({
      url: req.nextUrl,
      auth: { userId },
      ownerUserId: env.ALLOWED_OWNER_USER_ID,
      variant: "unread",
    }),
  );
}
