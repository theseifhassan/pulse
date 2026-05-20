"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "~/lib/utils";

// Pulse buttons: mono, uppercase tracked, restrained corners (4px), press
// micro-animation (90ms scale + 0.5px y). Four kinds carry meaning:
//   primary   — ink-on-paper, default action
//   signal    — pulse-red, "inspect"-style primary signal action
//   secondary — paper-on-paper with a strong rule, default neutral
//   ghost     — transparent, used for nav-style icon buttons
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 select-none rounded-[4px] " +
    "font-mono text-[12px] font-bold uppercase tracking-[0.08em] whitespace-nowrap " +
    "transition-[background,color,transform] duration-[160ms] ease-out " +
    "active:duration-[90ms] active:ease-in active:scale-[0.997] active:translate-y-[0.5px] " +
    "focus-visible:outline-1 focus-visible:outline-signal focus-visible:outline-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      kind: {
        primary: "bg-ink text-paper hover:bg-[color:var(--ink-2)]",
        signal: "bg-signal text-[color:var(--signal-ink)] hover:opacity-90",
        secondary:
          "bg-paper-2 text-ink border border-[color:var(--rule-strong)] hover:bg-paper-3",
        ghost: "bg-transparent text-ink hover:bg-paper-2",
      },
      size: {
        default: "min-h-[44px] px-[14px] py-[11px]",
        sm: "min-h-[36px] px-3 py-2 text-[11px]",
        icon: "min-h-[44px] min-w-[44px] px-0",
      },
    },
    defaultVariants: { kind: "secondary", size: "default" },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, kind, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ kind, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
