import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeedView } from "~/components/feed/feed-view";
import { Eyebrow } from "~/components/ui/eyebrow";
import { getServerEnv } from "~/lib/env";
import { DEFAULT_PAGE_SIZE } from "~/server/api/cursor";
import { fetchFeedPage } from "~/server/api/feed/list";
import { getDb } from "~/server/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();
  const env = getServerEnv();
  if (!userId) {
    redirect("/sign-in");
  }
  if (userId !== env.ALLOWED_OWNER_USER_ID) {
    return <ForbiddenState />;
  }
  const page = await fetchFeedPage(getDb(), {
    variant: "unread",
    cursor: null,
    limit: DEFAULT_PAGE_SIZE,
  });
  return <FeedView initial={page} variant="unread" />;
}

function ForbiddenState() {
  return (
    <div className="flex flex-col items-start gap-3 py-16">
      <Eyebrow tone="signal">403 · FORBIDDEN</Eyebrow>
      <h1 className="m-0 text-[32px] font-bold leading-[1.08] tracking-[-0.01em] text-ink lowercase">
        not your feed.
      </h1>
      <p className="max-w-[320px] text-[13px] leading-[1.55] text-ink-3">
        pulse is a single-owner surface. you&apos;re signed in but not the
        owner.
      </p>
    </div>
  );
}
