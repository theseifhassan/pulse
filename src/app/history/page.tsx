import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeedView } from "~/components/feed/feed-view";
import { getServerEnv } from "~/lib/env";
import { DEFAULT_PAGE_SIZE } from "~/server/api/cursor";
import { fetchFeedPage } from "~/server/api/feed/list";
import { getDb } from "~/server/db";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { userId } = await auth();
  const env = getServerEnv();
  if (!userId) {
    redirect("/sign-in");
  }
  if (userId !== env.ALLOWED_OWNER_USER_ID) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold text-[color:var(--ink)]">
          Forbidden
        </h1>
        <p className="max-w-md text-sm text-[color:var(--ink-mute)]">
          Pulse is a single-owner feed. You&apos;re signed in but not the owner.
        </p>
      </div>
    );
  }
  const page = await fetchFeedPage(getDb(), {
    variant: "history",
    cursor: null,
    limit: DEFAULT_PAGE_SIZE,
  });
  return <FeedView initial={page} variant="history" />;
}
