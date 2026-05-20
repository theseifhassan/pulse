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
import { Eyebrow } from "~/components/ui/eyebrow";
import { PulsingMark } from "~/components/ui/mark";
import { Rule } from "~/components/ui/rule";

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

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "STILL UP";
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  if (h < 21) return "GOOD EVENING";
  return "LATE";
}

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
        // silent — the user can refresh manually
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
        toast.error("could not load more.");
        console.error(e);
      }
    });
  }

  async function onToggleRead(item: FeedItem) {
    const wasRead = item.readAt !== null;
    const optimistic: FeedItem = {
      ...item,
      readAt: wasRead ? null : new Date().toISOString(),
    };
    if (variant === "unread" && !wasRead) {
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
      setItems((prev) => {
        const exists = prev.some((x) => x.id === item.id);
        if (exists) {
          return prev.map((x) => (x.id === item.id ? item : x));
        }
        return [item, ...prev];
      });
      toast.error("could not update read state.");
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
      toast.error("could not save feedback.");
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
      toast.success("noted.");
    } catch (e) {
      toast.error("could not save reasoning.");
      console.error(e);
    }
  }

  const headerEyebrow =
    variant === "unread" ? greetingFor(new Date()) : "INBOX";
  const itemCount = items.length;

  const headline =
    variant === "unread"
      ? itemCount === 0
        ? "quiet."
        : itemCount === 1
          ? "one thing,\nthen quiet."
          : itemCount <= 3
            ? `${spellCount(itemCount)} things,\nthen quiet.`
            : `${itemCount} things\nworth a look.`
      : itemCount === 0
        ? "nothing read yet."
        : "what you've seen.";

  const subhead =
    variant === "unread"
      ? itemCount === 0
        ? "nothing to inspect. i'll surface the next signal worth your time."
        : "these are worth your time. nothing else, until they are."
      : "items you've marked read, most recent first.";

  return (
    <div className="pb-24">
      <header className="px-4 py-7 sm:px-6 sm:py-8">
        <Eyebrow className="mb-2">{headerEyebrow}</Eyebrow>
        <h1 className="m-0 whitespace-pre-line text-[32px] font-bold leading-[1.08] tracking-[-0.01em] text-ink lowercase">
          {headline}
        </h1>
        <p className="mt-3 max-w-[320px] text-[13px] leading-[1.55] text-ink-3">
          <span className="italic">i read 412 items overnight.</span> {subhead}
        </p>
      </header>

      {itemCount > 0 ? (
        <>
          <Rule />
          <section>
            {items.map((item, i) => (
              <FeedCard
                key={item.id}
                item={item}
                vote={votes[item.id] ?? null}
                first={i === 0}
                onToggleRead={onToggleRead}
                onVote={onVote}
                onOpenReasoning={setReasoningFor}
              />
            ))}
          </section>
          <Rule />
        </>
      ) : null}

      {nextCursor ? (
        <div className="flex justify-center py-6">
          <Button
            type="button"
            kind="secondary"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "LOADING…" : "LOAD MORE"}
          </Button>
        </div>
      ) : itemCount > 0 ? (
        <footer className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <PulsingMark tone="ink-3" size={10} />
          <div className="mt-1 text-[12px] font-bold text-ink-2">
            you&apos;re up to date.
          </div>
          <div className="max-w-[240px] text-[11px] leading-[1.5] text-ink-3">
            i&apos;ll surface the next signal worth your time. nothing to do
            until then.
          </div>
        </footer>
      ) : null}

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

function spellCount(n: number): string {
  switch (n) {
    case 2:
      return "two";
    case 3:
      return "three";
    default:
      return String(n);
  }
}
