"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
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
          <SheetTitle>Why?</SheetTitle>
          <SheetDescription>
            Optional. Tell Layla what made this useful or noisy.
          </SheetDescription>
        </SheetHeader>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          aria-label="Feedback reasoning"
          className="w-full resize-y rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] p-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          placeholder="A short note for next time..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={async () => {
              await onSubmit(value);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
