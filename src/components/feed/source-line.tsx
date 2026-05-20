import { cn } from "~/lib/utils";

export interface SourceLineProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly source: string;
  readonly receivedAt: string; // already-formatted (e.g. "4h ago" or "09:12")
  readonly meta?: string; // optional trailing meta (e.g. read time)
  readonly highlight?: string; // optional signal-colored trailing token
}

// Repeated everywhere — favicon-square · name · meta · optional signal token.
export function SourceLine({
  className,
  source,
  receivedAt,
  meta,
  highlight,
  ...rest
}: SourceLineProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-[11px] text-ink-3",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="inline-block h-3 w-3 bg-ink opacity-60"
      />
      <span className="font-bold text-ink-2">{source}</span>
      <span aria-hidden="true">·</span>
      <span>{receivedAt}</span>
      {meta ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{meta}</span>
        </>
      ) : null}
      {highlight ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="font-bold text-signal">{highlight}</span>
        </>
      ) : null}
    </div>
  );
}
