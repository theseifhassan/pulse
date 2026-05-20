"use client";

import {
  ExternalLink,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import { SourceLine } from "~/components/feed/source-line";
import { Eyebrow } from "~/components/ui/eyebrow";
import { Mark } from "~/components/ui/mark";
import { cn, formatRelative } from "~/lib/utils";

export type Vote = "up" | "down" | null;

export interface FeedItem {
  readonly id: string;
  readonly title: string;
  readonly sourceUrl: string;
  readonly sourceName: string;
  readonly mediaUrl: string | null;
  readonly body: string;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export interface FeedCardProps {
  readonly item: FeedItem;
  readonly vote: Vote;
  readonly first: boolean;
  readonly kicker?: string;
  readonly kickerTone?: "default" | "signal" | "watch" | "verified";
  readonly onToggleRead: (item: FeedItem) => void;
  readonly onVote: (item: FeedItem, vote: Vote) => void;
  readonly onOpenReasoning: (item: FeedItem) => void;
}

const markTone = {
  default: "ink-3",
  signal: "signal",
  watch: "watch",
  verified: "verified",
} as const;

// One signal row. Magazine-stacked: hairline-separated, no card border, the
// mark dot acts as kicker color, body is mono with tight rhythm. Hover paints
// the row paper-2; press is the button-level micro-animation.
export function FeedCard({
  item,
  vote,
  first,
  kicker,
  kickerTone = "default",
  onToggleRead,
  onVote,
  onOpenReasoning,
}: FeedCardProps) {
  const isRead = item.readAt !== null;
  const effectiveKicker = kicker ?? (isRead ? "READ" : "NEW");
  const effectiveTone =
    kicker !== undefined ? kickerTone : isRead ? "default" : "signal";

  return (
    <article
      aria-label={item.title}
      className={cn(
        "group relative py-5 transition-colors duration-[160ms] ease-out",
        "hover:bg-paper-2",
        !first && "border-t border-[color:var(--rule-strong)]",
        isRead && "opacity-80",
      )}
    >
      <div className="flex gap-3 px-4 sm:px-6">
        <Mark tone={markTone[effectiveTone]} size={8} className="mt-[7px]" />
        <div className="min-w-0 flex-1">
          <Eyebrow tone={effectiveTone} className="mb-1.5">
            {effectiveKicker}
          </Eyebrow>
          {/* Item title — lowercase, mono, treated as object not sentence. */}
          <h3 className="mb-1.5 text-[18px] font-bold leading-[1.22] tracking-[-0.005em] text-ink text-pretty lowercase">
            {item.title}
          </h3>
          <p className="mb-2.5 text-[13px] leading-[1.55] text-ink-2 whitespace-pre-line">
            {item.body}
          </p>
          <SourceLine
            source={item.sourceName}
            receivedAt={formatRelative(item.createdAt)}
            className="mb-2"
          />
          {item.mediaUrl ? (
            <div className="mt-2 mb-2 -mx-4 sm:-mx-6">
              <Image
                src={item.mediaUrl}
                alt=""
                width={1280}
                height={720}
                loading="lazy"
                unoptimized
                className="block aspect-[16/9] w-full border-y border-[color:var(--rule)] object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <ActionButton
                aria-label="Thumbs up"
                aria-pressed={vote === "up"}
                active={vote === "up"}
                onClick={() => onVote(item, vote === "up" ? null : "up")}
              >
                <ThumbsUp className="h-4 w-4" />
              </ActionButton>
              <ActionButton
                aria-label="Thumbs down"
                aria-pressed={vote === "down"}
                active={vote === "down"}
                onClick={() => onVote(item, vote === "down" ? null : "down")}
              >
                <ThumbsDown className="h-4 w-4" />
              </ActionButton>
              <ActionButton
                aria-label="Add reasoning"
                onClick={() => onOpenReasoning(item)}
              >
                <MessageSquare className="h-4 w-4" />
              </ActionButton>
            </div>
            <div className="flex items-center gap-0.5">
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Open source"
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center text-ink-3 no-underline transition-colors duration-[160ms] ease-out",
                  "hover:bg-paper-3 hover:text-signal hover:no-underline",
                  "active:duration-[90ms] active:ease-in active:scale-[0.997]",
                  "focus-visible:outline-1 focus-visible:outline-signal focus-visible:outline-offset-2",
                )}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <ActionButton
                aria-label={isRead ? "Mark unread" : "Mark read"}
                aria-pressed={isRead}
                active={isRead}
                onClick={() => onToggleRead(item)}
              >
                {isRead ? (
                  <Undo2 className="h-4 w-4" />
                ) : (
                  // Square mark as the "complete" indicator — matches the
                  // design system rule that says "never a green circle".
                  <Mark tone="ink-3" size={10} />
                )}
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly active?: boolean;
}

function ActionButton({
  active,
  className,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center text-ink-3 transition-colors duration-[160ms] ease-out",
        "hover:bg-paper-3 hover:text-ink",
        "active:duration-[90ms] active:ease-in active:scale-[0.997]",
        "focus-visible:outline-1 focus-visible:outline-signal focus-visible:outline-offset-2",
        active && "text-signal hover:text-signal",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
