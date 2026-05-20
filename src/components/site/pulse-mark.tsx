// The Pulse brand mark — Lucide Activity glyph drawn in ink on a transparent
// background so the mark reads as a text glyph in the top bar rather than as
// a chip. Used wherever the brand needs a 16–32px presence.
export interface PulseMarkProps {
  readonly size?: number;
  readonly className?: string;
}

export function PulseMark({ size = 16, className }: PulseMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(4,4)">
        <polyline
          points="22 12 18 12 15 21 9 3 6 12 2 12"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
