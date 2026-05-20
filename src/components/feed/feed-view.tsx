"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  FeedCard,
  type FeedItem,
  type Vote,
} from "~/components/feed/feed-card";
import { ReasoningSheet } from "~/components/feed/reasoning-sheet";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

export interface FeedViewProps {
  readonly initial: {
    readonly items: readonly FeedItem[];
    readonly nextCursor: string | null;
  };
  readonly variant: "unread" | "history";
}

interface VoteMap {
  [itemId: string]: Vote;
}

const ENDPOINT_BY_VARIANT = {
  unread: "/api/feed/unread",
  history: "/api/feed/history",
} as const;

export function FeedView({ initial, variant }: FeedViewProps) {
  const [items, setItems] = useState<FeedItem[]>([...initial.items]);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initial.nextCursor,
  );
  const [isLoadingMore, startLoadMore] = useTransition();
  const [votes, setVotes] = useState<VoteMap>({});
  const [reasoningFor, setReasoningFor] = useState<FeedItem | null>(null);

  const refreshOnVisibility = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    void fetch(ENDPOINT_BY_VARIANT[variant])
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((page: { items: FeedItem[]; nextCursor: string | null }) => {
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        // silent — the user can pull-to-refresh
      });
  }, [variant]);

  useEffect(() => {
    document.addEventListener("visibilitychange", refreshOnVisibility);
    return () =>
      document.removeEventListener("visibilitychange", refreshOnVisibility);
  }, [refreshOnVisibility]);

  function loadMore() {
    if (!nextCursor) return;
    startLoadMore(async () => {
      try {
        const res = await fetch(
          `${ENDPOINT_BY_VARIANT[variant]}?cursor=${encodeURIComponent(nextCursor)}`,
        );
        if (!res.ok) throw new Error(`fetch failed (${res.status})`);
        const page = (await res.json()) as {
          items: FeedItem[];
          nextCursor: string | null;
        };
        setItems((prev) => [...prev, ...page.items]);
        setNextCursor(page.nextCursor);
      } catch (e) {
        toast.error("Could not load more items.");
        console.error(e);
      }
    });
  }

  async function onToggleRead(item: FeedItem) {
    // Optimistic — flip locally, then PATCH.
    const wasRead = item.readAt !== null;
    const optimistic: FeedItem = {
      ...item,
      readAt: wasRead ? null : new Date().toISOString(),
    };
    if (variant === "unread" && !wasRead) {
      // After marking read on the unread view, drop the item from the list.
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } else {
      setItems((prev) => prev.map((x) => (x.id === item.id ? optimistic : x)));
    }
    try {
      const res = await fetch(`/api/feed/${item.id}/read`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ read: !wasRead }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } catch (e) {
      // rollback
      setItems((prev) => {
        const exists = prev.some((x) => x.id === item.id);
        if (exists) {
          return prev.map((x) => (x.id === item.id ? item : x));
        }
        return [item, ...prev];
      });
      toast.error("Could not update read state.");
      console.error(e);
    }
  }

  async function onVote(item: FeedItem, next: Vote) {
    const prevVote = votes[item.id] ?? null;
    setVotes((m) => ({ ...m, [item.id]: next }));
    try {
      const res = await fetch(`/api/feed/${item.id}/feedback`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vote: next, reasoning: null }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } catch (e) {
      setVotes((m) => ({ ...m, [item.id]: prevVote }));
      toast.error("Could not save feedback.");
      console.error(e);
    }
  }

  async function onSubmitReasoning(itemId: string, reasoning: string) {
    const vote = votes[itemId] ?? null;
    try {
      const res = await fetch(`/api/feed/${itemId}/feedback`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vote, reasoning: reasoning || null }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      toast.success("Thanks. Layla noted it.");
    } catch (e) {
      toast.error("Could not save reasoning.");
      console.error(e);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold text-[color:var(--ink)] sm:text-3xl">
          {variant === "unread"
            ? "Nothing new to inspect."
            : "Nothing in history yet."}
        </h1>
        <p className="max-w-md text-sm text-[color:var(--ink-mute)]">
          {variant === "unread"
            ? "Layla will surface things worth your attention here."
            : "Items you mark read will show up here."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {items.map((item) => (
        <FeedCard
          key={item.id}
          item={item}
          vote={votes[item.id] ?? null}
          onToggleRead={onToggleRead}
          onVote={onVote}
          onOpenReasoning={setReasoningFor}
        />
      ))}
      {nextCursor ? (
        <div className="flex justify-center py-4">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : items.length >= 3 ? (
        <p className="py-4 text-center text-xs text-[color:var(--ink-mute)]">
          You&apos;re all caught up.
        </p>
      ) : null}
      {isLoadingMore ? <Skeleton className="h-32" /> : null}
      <ReasoningSheet
        open={reasoningFor !== null}
        onOpenChange={(o) => {
          if (!o) setReasoningFor(null);
        }}
        onSubmit={(value) => {
          if (reasoningFor) {
            return onSubmitReasoning(reasoningFor.id, value);
          }
        }}
      />
    </div>
  );
}
