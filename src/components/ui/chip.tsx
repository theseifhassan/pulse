import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-pill px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[0.14em] whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-paper-3 text-ink-3",
        outline: "border border-[color:var(--rule-strong)] text-ink-2",
        signal: "bg-signal text-[color:var(--signal-ink)]",
        watch: "bg-watch-soft text-watch",
        verified: "bg-verified-soft text-verified",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

export function Chip({ className, tone, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ tone }), className)} {...props} />;
}
