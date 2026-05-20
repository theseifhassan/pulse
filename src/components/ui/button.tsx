"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--ink)] text-[color:var(--paper)] hover:opacity-90",
        ghost: "text-[color:var(--ink)] hover:bg-[color:var(--paper-2)]",
        outline:
          "border border-[color:var(--rule)] bg-[color:var(--paper)] text-[color:var(--ink)] hover:bg-[color:var(--paper-2)]",
        accent:
          "bg-[color:var(--accent)] text-[color:var(--paper)] hover:opacity-90",
        danger:
          "border border-[color:var(--danger)] bg-transparent text-[color:var(--danger)] hover:bg-[color:var(--paper-2)]",
      },
      size: {
        default: "min-h-[44px] px-4 py-2",
        sm: "min-h-[36px] px-3 text-xs",
        icon: "min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
