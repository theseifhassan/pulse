import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { classifyRoute } from "~/server/auth/route-policy";

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const route = classifyRoute(pathname);
  if (route === "agent") {
    // /api/ingest authenticates via bearer token (pulse-my8.5); skip Clerk.
    return NextResponse.next();
  }
  if (route === "public") {
    return NextResponse.next();
  }

  // owner-protected. For owner-facing API routes we return JSON 401 instead
  // of redirecting to the Clerk sign-in page so callers (the SPA, Layla, or
  // future automations) get a deterministic, machine-readable response. For
  // page routes the Clerk redirect is still the better UX.
  const { userId } = await auth();
  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", reason: "not authenticated" },
        { status: 401 },
      );
    }
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/(.*)",
  ],
};
