"use client";

import {
  Check,
  ExternalLink,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
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
  readonly onToggleRead: (item: FeedItem) => void;
  readonly onVote: (item: FeedItem, vote: Vote) => void;
  readonly onOpenReasoning: (item: FeedItem) => void;
}

export function FeedCard({
  item,
  vote,
  onToggleRead,
  onVote,
  onOpenReasoning,
}: FeedCardProps) {
  const isRead = item.readAt !== null;
  return (
    <Card
      aria-label={item.title}
      className={cn(
        "transition-opacity",
        isRead && "bg-[color:var(--paper-2)] opacity-70",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-[color:var(--ink-mute)]">
          <span className="truncate" title={item.sourceName}>
            {item.sourceName}
          </span>
          <time dateTime={item.createdAt}>
            {formatRelative(item.createdAt)}
          </time>
        </div>
        <h2 className="font-serif text-lg font-semibold leading-snug text-[color:var(--ink)] sm:text-xl">
          {item.title}
        </h2>
      </CardHeader>
      {item.mediaUrl ? (
        <div className="px-4 sm:px-5">
          <Image
            src={item.mediaUrl}
            alt=""
            width={1280}
            height={720}
            loading="lazy"
            unoptimized
            className="aspect-[16/9] w-full rounded-md border border-[color:var(--rule)] object-cover"
            onError={(e) => {
              // Graceful media fallback per the design constraints: hide the
              // broken image rather than show a placeholder icon.
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : null}
      <CardContent>
        <p className="whitespace-pre-line text-sm leading-relaxed text-[color:var(--ink-soft)]">
          {item.body}
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={vote === "up" ? "accent" : "ghost"}
            size="icon"
            aria-label="Thumbs up"
            aria-pressed={vote === "up"}
            onClick={() => onVote(item, vote === "up" ? null : "up")}
          >
            <ThumbsUp className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant={vote === "down" ? "accent" : "ghost"}
            size="icon"
            aria-label="Thumbs down"
            aria-pressed={vote === "down"}
            onClick={() => onVote(item, vote === "down" ? null : "down")}
          >
            <ThumbsDown className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Add reasoning"
            onClick={() => onOpenReasoning(item)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Open source">
            <a href={item.sourceUrl} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
          <Button
            type="button"
            variant={isRead ? "outline" : "ghost"}
            size="icon"
            aria-label={isRead ? "Mark unread" : "Mark read"}
            aria-pressed={isRead}
            onClick={() => onToggleRead(item)}
          >
            {isRead ? (
              <Undo2 className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
