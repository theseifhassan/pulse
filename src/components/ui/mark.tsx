import { cn } from "~/lib/utils";

export interface MarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly size?: number;
  readonly tone?: "ink" | "ink-3" | "signal" | "watch" | "verified";
}

const toneVar: Record<NonNullable<MarkProps["tone"]>, string> = {
  ink: "var(--ink)",
  "ink-3": "var(--ink-3)",
  signal: "var(--signal)",
  watch: "var(--watch)",
  verified: "var(--verified)",
};

// The Pulse mark — a solid square. Used as inline separator and as a status
// indicator. Color carries meaning; size is mono-aligned (default 10px).
export function Mark({
  className,
  size = 10,
  tone = "ink",
  style,
  ...props
}: MarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: toneVar[tone],
        ...style,
      }}
      {...props}
    />
  );
}

// Heartbeat-blink variant — opacity oscillates 1 → 0.4 → 1 over 1.4s.
export function PulsingMark(props: MarkProps) {
  return (
    <Mark
      {...props}
      style={{
        animation: "pulse-blink 1.4s ease-in-out infinite",
        ...props.style,
      }}
    />
  );
}
