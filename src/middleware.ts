import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { classifyRoute } from "~/server/auth/route-policy";

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const route = classifyRoute(req.nextUrl.pathname);
  if (route === "agent") {
    // /api/ingest authenticates via bearer token (see pulse-my8.5); skip Clerk.
    return NextResponse.next();
  }
  if (route === "public") {
    return NextResponse.next();
  }
  // owner-protected: require an authenticated session. The owner-identity
  // check (userId === ALLOWED_OWNER_USER_ID) happens inside each handler
  // via `requireOwner` so non-owner authenticated users get a clean 403.
  await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/(.*)",
  ],
};
