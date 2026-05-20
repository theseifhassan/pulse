"use client";

import { ChevronsDown, RotateCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type FeedItem,
  SignalCard,
  type SignalStatus,
  type Vote,
} from "~/components/feed/signal-card";
import { Eyebrow } from "~/components/ui/eyebrow";
import { PulsingMark } from "~/components/ui/mark";
import { Rule } from "~/components/ui/rule";
import { groupByDay } from "~/lib/day-group";
import { cn } from "~/lib/utils";

interface Page {
  readonly items: readonly FeedItem[];
  readonly nextCursor: string | null;
}

export interface FeedViewProps {
  readonly initialFeed: Page;
  readonly initialArchived: Page;
}

type Tab = "feed" | "archived";

const ENDPOINT: Record<Tab, string> = {
  feed: "/api/feed/unread",
  archived: "/api/feed/history",
};

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} LOCAL`;
}

export function FeedView({ initialFeed, initialArchived }: FeedViewProps) {
  const [tab, setTab] = useState<Tab>("feed");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    ...initialFeed.items,
  ]);
  const [archivedItems, setArchivedItems] = useState<FeedItem[]>([
    ...initialArchived.items,
  ]);
  const [feedCursor, setFeedCursor] = useState<string | null>(
    initialFeed.nextCursor,
  );
  const [archivedCursor, setArchivedCursor] = useState<string | null>(
    initialArchived.nextCursor,
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    initialFeed.items[0]?.id ?? null,
  );
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [reviewedStatus, setReviewedStatus] = useState<
    Record<string, SignalStatus>
  >({});
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    kind: "new" | "quiet";
    text: string;
  } | null>(null);
  const [lastChecked, setLastChecked] = useState(() => nowHHMM());
  const [loadingMore, startLoadMore] = useTransition();
  const scrollSentinel = useRef<HTMLButtonElement | null>(null);

  const activeItems = tab === "feed" ? feedItems : archivedItems;
  const activeCursor = tab === "feed" ? feedCursor : archivedCursor;
  const setActiveItems = tab === "feed" ? setFeedItems : setArchivedItems;
  const setActiveCursor = tab === "feed" ? setFeedCursor : setArchivedCursor;
  const groups = groupByDay(activeItems, tab === "feed" ? "feed" : "archived");

  const refresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshResult(null);
    void fetch(ENDPOINT.feed)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((page: Page) => {
        const incoming = page.items;
        const knownIds = new Set(feedItems.map((s) => s.id));
        const fresh = incoming.filter((s) => !knownIds.has(s.id));
        setFeedItems([...page.items]);
        setFeedCursor(page.nextCursor);
        setLastChecked(nowHHMM());
        setRefreshResult(
          fresh.length === 0
            ? { kind: "quiet", text: "no new signals · quiet" }
            : {
                kind: "new",
                text: `${fresh.length} new · added to today`,
              },
        );
      })
      .catch(() => {
        setRefreshResult({ kind: "quiet", text: "couldn't reach the agent" });
      })
      .finally(() => {
        setRefreshing(false);
        setTimeout(() => setRefreshResult(null), 2800);
      });
  }, [refreshing, feedItems]);

  const loadMore = useCallback(() => {
    if (!activeCursor || loadingMore) return;
    startLoadMore(async () => {
      try {
        const res = await fetch(
          `${ENDPOINT[tab]}?cursor=${encodeURIComponent(activeCursor)}`,
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const page = (await res.json()) as Page;
        setActiveItems((prev) => [...prev, ...page.items]);
        setActiveCursor(page.nextCursor);
      } catch (e) {
        toast.error("could not load earlier signals.");
        console.error(e);
      }
    });
  }, [activeCursor, loadingMore, tab, setActiveItems, setActiveCursor]);

  // Auto load-more when the sentinel scrolls into the viewport.
  useEffect(() => {
    const el = scrollSentinel.current;
    if (!el || !activeCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) loadMore();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeCursor, loadingMore, loadMore]);

  // Tab change resets the expanded card.
  function switchTab(next: Tab) {
    setTab(next);
    setExpandedId(null);
  }

  function toggleExpand(item: FeedItem) {
    setExpandedId((curr) => (curr === item.id ? null : item.id));
  }

  async function onVote(item: FeedItem, next: Vote) {
    const prev = votes[item.id] ?? null;
    setVotes((m) => ({ ...m, [item.id]: next }));
    // Optimistically promote the item to "reviewed" — it migrates out of feed.
    const newStatus: SignalStatus =
      next === "up" ? "liked" : next === "down" ? "disliked" : null;
    setReviewedStatus((s) => ({ ...s, [item.id]: newStatus }));
    if (next !== null && tab === "feed") {
      // Remove from feed list immediately; let the server-side mark-read sync
      // separately so the unread query stops returning it.
      setFeedItems((curr) => curr.filter((s) => s.id !== item.id));
      setArchivedItems((curr) => {
        if (curr.some((s) => s.id === item.id)) return curr;
        return [{ ...item, readAt: new Date().toISOString() }, ...curr];
      });
    }
    setExpandedId(null);
    try {
      // Persist the feedback.
      const fbRes = await fetch(`/api/feed/${item.id}/feedback`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vote: next, reasoning: null }),
      });
      if (!fbRes.ok) throw new Error(`feedback ${fbRes.status}`);
      // Mark the item read so the unread feed stops surfacing it.
      if (next !== null) {
        const readRes = await fetch(`/api/feed/${item.id}/read`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ read: true }),
        });
        if (!readRes.ok) throw new Error(`read ${readRes.status}`);
      }
    } catch (e) {
      // Roll back the vote + restore the item to the feed list.
      setVotes((m) => ({ ...m, [item.id]: prev }));
      setReviewedStatus((s) => {
        const { [item.id]: _omit, ...rest } = s;
        return rest;
      });
      if (next !== null && tab === "feed") {
        setFeedItems((curr) => {
          if (curr.some((s) => s.id === item.id)) return curr;
          return [item, ...curr];
        });
        setArchivedItems((curr) => curr.filter((s) => s.id !== item.id));
      }
      toast.error("could not save feedback.");
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col">
      {/* View tabs */}
      <div className="flex border-b border-[color:var(--rule-strong)]">
        <TabButton active={tab === "feed"} onClick={() => switchTab("feed")}>
          FEED
        </TabButton>
        <TabButton
          active={tab === "archived"}
          onClick={() => switchTab("archived")}
        >
          ARCHIVED
        </TabButton>
      </div>

      {/* Refresh row — only on FEED */}
      {tab === "feed" ? (
        <RefreshRow
          refreshing={refreshing}
          result={refreshResult}
          lastChecked={lastChecked}
          onRefresh={refresh}
        />
      ) : null}

      {/* Empty / grouped list */}
      {activeItems.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div>
          {groups.map((g, gi) => (
            <section key={`${g.key}-${gi}`}>
              <div className="flex items-center justify-center px-4 py-5">
                <Eyebrow className="leading-none">
                  {g.label} · {g.items.length}{" "}
                  {g.items.length === 1 ? "ITEM" : "ITEMS"}
                </Eyebrow>
              </div>
              <Rule />
              {g.items.map((item, i) => (
                <SignalCard
                  key={item.id}
                  item={item}
                  rank={i + 1}
                  first={i === 0}
                  expanded={expandedId === item.id}
                  archived={tab === "archived"}
                  vote={votes[item.id] ?? null}
                  status={
                    reviewedStatus[item.id] ??
                    (tab === "archived" ? "read" : null)
                  }
                  onToggleExpand={toggleExpand}
                  onVote={onVote}
                />
              ))}
              <Rule />
            </section>
          ))}

          {/* Load more / exhausted */}
          {activeCursor ? (
            <button
              type="button"
              ref={scrollSentinel as React.RefObject<HTMLButtonElement>}
              onClick={loadMore}
              aria-label="load earlier signals"
              className={cn(
                "flex w-full cursor-pointer select-none items-center justify-center gap-2 border-t border-[color:var(--rule)] bg-transparent px-4 py-[18px] transition-colors duration-[160ms] ease-out",
                "hover:bg-paper-2",
              )}
            >
              {loadingMore ? (
                <>
                  <PulsingMark tone="ink-3" size={7} />
                  <Eyebrow className="leading-none text-ink-2">
                    READING EARLIER…
                  </Eyebrow>
                </>
              ) : (
                <>
                  <Eyebrow className="leading-none text-ink-2">
                    LOAD EARLIER
                  </Eyebrow>
                  <ChevronsDown className="h-3 w-3 text-ink-3" />
                </>
              )}
            </button>
          ) : (
            <Tail />
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px flex-1 cursor-pointer border-b-2 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-[160ms] ease-out",
        active
          ? "border-ink bg-paper text-ink"
          : "border-transparent bg-transparent text-ink-3 hover:text-ink-2",
      )}
    >
      {children}
    </button>
  );
}

function RefreshRow({
  refreshing,
  result,
  lastChecked,
  onRefresh,
}: {
  readonly refreshing: boolean;
  readonly result: { kind: "new" | "quiet"; text: string } | null;
  readonly lastChecked: string;
  readonly onRefresh: () => void;
}) {
  const showResult = !!result && !refreshing;
  return (
    <button
      type="button"
      onClick={refreshing ? undefined : onRefresh}
      disabled={refreshing}
      aria-label="refresh feed"
      aria-busy={refreshing}
      className={cn(
        "flex w-full select-none items-center justify-between gap-3 border-b border-[color:var(--rule)] bg-paper px-4 py-2.5 text-left transition-colors duration-[160ms] ease-out",
        refreshing ? "bg-paper-2" : "cursor-pointer hover:bg-paper-2",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {refreshing ? (
          <>
            <PulsingMark tone="signal" size={7} />
            <Eyebrow className="leading-none text-ink-2">
              READING SOURCES…
            </Eyebrow>
          </>
        ) : showResult ? (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-[7px] w-[7px] rounded-full",
                result.kind === "new" ? "bg-signal" : "bg-ink-3",
              )}
            />
            <Eyebrow
              tone={result.kind === "new" ? "signal" : "default"}
              className="leading-none"
            >
              {result.text}
            </Eyebrow>
          </>
        ) : (
          <>
            <Eyebrow className="leading-none" style={{ fontSize: 10 }}>
              LAST CHECKED
            </Eyebrow>
            <Eyebrow
              className="leading-none text-ink-2"
              style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
            >
              {lastChecked}
            </Eyebrow>
          </>
        )}
      </div>
      <div
        className={cn(
          "inline-grid h-7 w-7 place-items-center transition-colors duration-[160ms] ease-out",
          refreshing ? "text-ink-4" : "text-ink-2",
        )}
        style={{
          animation: refreshing ? "spin 1.2s linear infinite" : "none",
        }}
      >
        <RotateCw className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

function EmptyState({ tab }: { readonly tab: Tab }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-12 text-center">
      <div className="text-[13px] font-bold text-ink-2">
        {tab === "feed" ? "feed is empty." : "no archived items yet."}
      </div>
      <div className="max-w-[260px] text-[11px] italic leading-[1.55] text-ink-3">
        {tab === "feed"
          ? "nothing waiting for your review."
          : "rate any feed item and it'll land here."}
      </div>
    </div>
  );
}

function Tail() {
  return (
    <footer className="border-t border-[color:var(--rule)] px-4 py-6 text-center text-[11px] italic text-ink-3">
      no further history.
    </footer>
  );
}
