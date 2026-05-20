import { auth } from "@clerk/nextjs/server";
import type { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "~/lib/env";
import { handleReadToggle } from "~/server/api/feed/read";
import { runHandler } from "~/server/effect/runtime";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const env = getServerEnv();
  const { userId } = await auth();
  const { id } = await params;
  return runHandler(
    handleReadToggle({
      req,
      itemId: id,
      auth: { userId },
      ownerUserId: env.ALLOWED_OWNER_USER_ID,
    }),
  );
}
