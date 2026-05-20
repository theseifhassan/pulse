import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeedView } from "~/components/feed/feed-view";
import { Eyebrow } from "~/components/ui/eyebrow";
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
      <div className="flex flex-col items-start gap-3 py-16">
        <Eyebrow tone="signal">403 · FORBIDDEN</Eyebrow>
        <h1 className="m-0 text-[32px] font-bold leading-[1.08] tracking-[-0.01em] text-ink lowercase">
          not your feed.
        </h1>
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
