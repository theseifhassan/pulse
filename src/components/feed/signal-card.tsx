"use client";

import { ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import { Eyebrow } from "~/components/ui/eyebrow";
import { inferKind, inferReadLabel, KIND_LABEL } from "~/lib/signal-kind";
import { cn } from "~/lib/utils";

export type Vote = "up" | "down" | null;

export interface FeedItem {
  readonly id: string;
  readonly title: string;
  readonly sourceUrl: string;
  readonly sourceName: string;
  readonly summary: string;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly vote: Vote;
}

export type SignalStatus =
  | null
  | "liked"
  | "disliked"
  | "read"
  | "saved"
  | "dismissed";

export interface SignalCardProps {
  readonly item: FeedItem;
  readonly rank: number;
  readonly first: boolean;
  readonly expanded: boolean;
  readonly archived: boolean;
  readonly vote: Vote;
  readonly status: SignalStatus;
  readonly onToggleExpand: (item: FeedItem) => void;
  readonly onVote: (item: FeedItem, vote: Vote) => void;
}

function SourceFavicon({ host, size = 12 }: { host: string; size?: number }) {
  const letter = (host || "?").replace(/^www\./, "")[0]?.toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center bg-ink text-paper font-bold leading-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.66),
        opacity: 0.85,
      }}
    >
      {letter}
    </span>
  );
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const STATUS_BADGE: Record<
  Exclude<SignalStatus, null>,
  { label: string; tone: "default" | "signal" | "verified" }
> = {
  liked: { label: "LIKED", tone: "verified" },
  disliked: { label: "DIDN'T", tone: "signal" },
  read: { label: "READ", tone: "default" },
  saved: { label: "SAVED", tone: "default" },
  dismissed: { label: "DISMISSED", tone: "default" },
};

// One row in the feed. Matches the design's SignalCard:
// rank gutter ("01") · KIND · LENGTH eyebrow row · lowercase mono title ·
// 13px summary · inline expand revealing source line + thumbs feedback.
export function SignalCard({
  item,
  rank,
  first,
  expanded,
  archived,
  vote,
  status,
  onToggleExpand,
  onVote,
}: SignalCardProps) {
  const kind = inferKind(item.sourceUrl);
  const readLabel = inferReadLabel(item.summary, kind);
  const kindLabel = KIND_LABEL[kind];
  const host = hostFromUrl(item.sourceUrl);
  const statusBadge = status ? STATUS_BADGE[status] : null;

  return (
    <article
      className={cn(
        "relative transition-colors duration-[160ms] ease-out",
        expanded && "bg-paper-2",
        !first && "border-t border-[color:var(--rule-strong)]",
      )}
    >
      {/* Full-card click target — the design has the whole row toggle. Using
          a button overlay rather than role="button" on the article keeps the
          article semantic and the activation keyboard-correct. */}
      <button
        type="button"
        onClick={() => onToggleExpand(item)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} signal: ${item.title}`}
        className={cn(
          "absolute inset-0 z-0 cursor-pointer bg-transparent transition-colors duration-[160ms] ease-out hover:bg-paper-2",
          "focus-visible:outline-1 focus-visible:outline-signal focus-visible:outline-offset-[-2px]",
        )}
      />
      <div className="pointer-events-none relative z-10 px-4 pb-[22px] pt-5">
        {/* Rank gutter — "01 / 02 / 03" */}
        <div
          aria-hidden="true"
          className="absolute left-4 top-[22px] w-[18px] text-[10px] font-bold uppercase tracking-[0.14em] leading-none text-ink-4"
        >
          {String(rank).padStart(2, "0")}
        </div>
        <div className="pl-7">
          {/* Kicker — TYPE · LENGTH · STATUS */}
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Eyebrow className="leading-none">{kindLabel}</Eyebrow>
            <span
              aria-hidden="true"
              className="text-[10px] tracking-[0.14em] text-ink-4"
            >
              ·
            </span>
            <Eyebrow className="leading-none">{readLabel}</Eyebrow>
            {statusBadge ? (
              <>
                <span
                  aria-hidden="true"
                  className="text-[10px] tracking-[0.14em] text-ink-4"
                >
                  ·
                </span>
                <Eyebrow tone={statusBadge.tone} className="leading-none">
                  {statusBadge.label}
                </Eyebrow>
              </>
            ) : null}
          </div>
          {/* Title — lowercase, mono, treated as object not sentence. */}
          <h2 className="m-0 mb-2 text-[18px] font-bold leading-[1.22] tracking-[-0.005em] text-ink text-pretty lowercase">
            {item.title}
          </h2>
          <p className="m-0 text-[13px] leading-[1.55] text-ink-2 text-pretty">
            {item.summary}
          </p>

          {/* Expanded panel — source line + thumbs feedback. Re-enables
              pointer events (parent disables them so the absolute toggle
              receives card-wide clicks). */}
          {expanded ? (
            <div
              className="pointer-events-auto mt-4 flex flex-col gap-3.5 border-t border-dashed border-[color:var(--rule-strong)] pt-4"
              style={{ animation: "slide-in 260ms var(--ease-out)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-wrap items-center gap-2 no-underline text-ink-2 hover:underline hover:decoration-signal hover:underline-offset-[3px]"
                >
                  <SourceFavicon host={host} />
                  <span className="text-[11px] font-bold">
                    {item.sourceName}
                  </span>
                  <ExternalLink className="ml-0.5 h-[11px] w-[11px] text-ink-4" />
                </a>
                {!archived ? (
                  <div className="ml-auto flex gap-0.5">
                    <FeedbackButton
                      aria-label="Liked it"
                      title="Liked it"
                      tint="verified"
                      active={vote === "up"}
                      onClick={() => onVote(item, vote === "up" ? null : "up")}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </FeedbackButton>
                    <FeedbackButton
                      aria-label="Didn't like it"
                      title="Didn't like it"
                      tint="signal"
                      active={vote === "down"}
                      onClick={() =>
                        onVote(item, vote === "down" ? null : "down")
                      }
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </FeedbackButton>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

interface FeedbackButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly tint: "verified" | "signal";
  readonly active?: boolean;
}

function FeedbackButton({
  tint,
  active,
  className,
  children,
  ...props
}: FeedbackButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-grid h-7 w-7 place-items-center rounded-pill bg-transparent text-ink-3 transition-colors duration-[160ms] ease-out",
        "hover:bg-paper-3",
        "active:duration-[90ms] active:ease-in active:scale-[0.92]",
        "focus-visible:outline-1 focus-visible:outline-signal focus-visible:outline-offset-2",
        tint === "verified" && "hover:text-verified",
        tint === "signal" && "hover:text-signal",
        active && tint === "verified" && "text-verified",
        active && tint === "signal" && "text-signal",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
