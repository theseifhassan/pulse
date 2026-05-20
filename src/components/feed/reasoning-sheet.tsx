"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Eyebrow } from "~/components/ui/eyebrow";
import { PulsingMark } from "~/components/ui/mark";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

export interface ReasoningSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly initialValue?: string;
  readonly onSubmit: (reasoning: string) => void | Promise<void>;
}

// Picks up the design's "■ Pulse — i flagged this because…" panel cadence:
// pulsing mark + tracked eyebrow + italic-led prompt.
export function ReasoningSheet({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
}: ReasoningSheetProps) {
  const [value, setValue] = useState(initialValue ?? "");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <PulsingMark size={9} />
            <Eyebrow>WHY?</Eyebrow>
          </div>
          <SheetTitle className="sr-only">Reasoning</SheetTitle>
          <SheetDescription>
            <span className="italic">optional.</span> tell layla what made this
            useful or noisy. she&apos;ll fold it into next time.
          </SheetDescription>
        </SheetHeader>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          aria-label="Feedback reasoning"
          className="mt-2 block w-full resize-y rounded-[4px] border border-[color:var(--rule-strong)] bg-paper p-3 font-mono text-[13px] leading-[1.55] text-ink placeholder:text-ink-4 focus:border-signal focus:outline-none"
          placeholder="a short note for next time..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button kind="ghost" onClick={() => onOpenChange(false)}>
            CANCEL
          </Button>
          <Button
            kind="signal"
            onClick={async () => {
              await onSubmit(value);
              onOpenChange(false);
            }}
          >
            SAVE
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
