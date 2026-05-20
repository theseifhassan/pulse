import { cn } from "~/lib/utils";

// Rules carry the layout, not shadows. `Rule` is the strong (~20% ink) variant
// used to separate items in a list; `Hairline` is the soft (~10% ink) variant.
export function Rule({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full bg-[color:var(--rule-strong)]", className)}
      {...props}
    />
  );
}

export function Hairline({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full bg-[color:var(--rule)]", className)}
      {...props}
    />
  );
}
