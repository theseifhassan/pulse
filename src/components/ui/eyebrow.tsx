import { cn } from "~/lib/utils";

export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly tone?: "default" | "signal" | "watch" | "verified";
}

const toneClass: Record<NonNullable<EyebrowProps["tone"]>, string> = {
  default: "text-ink-3",
  signal: "text-signal",
  watch: "text-watch",
  verified: "text-verified",
};

// The signature kicker / label — 11px / 700 / uppercase / +14% tracking.
export function Eyebrow({
  className,
  tone = "default",
  ...props
}: EyebrowProps) {
  return (
    <div
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.14em] leading-snug",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
