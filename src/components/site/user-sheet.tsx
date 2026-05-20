"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "~/components/site/theme-provider";
import { Eyebrow } from "~/components/ui/eyebrow";
import { cn } from "~/lib/utils";

export interface UserSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

// Slide-in side sheet that takes over the right edge of the viewport.
// Matches the Pulse design system: 44×44 square monogram, name + email
// header, LIGHT / DARK segmented toggle, signal-outlined SIGN OUT button.
export function UserSheet({ open, onClose }: UserSheetProps) {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "you";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (name || "?")[0]?.toUpperCase() ?? "?";
  const imageUrl = user?.hasImage ? user.imageUrl : null;

  return (
    <>
      <button
        type="button"
        aria-label="close menu"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-[rgba(22,20,15,0.32)]"
        style={{ animation: "fade-in 200ms var(--ease-out)" }}
      />
      <aside
        role="dialog"
        aria-label="account menu"
        aria-modal="true"
        className="fixed bottom-0 right-0 top-0 z-50 flex w-[300px] max-w-[calc(100%-40px)] flex-col border-l border-[color:var(--rule-strong)] bg-paper font-mono"
        style={{ animation: "sheet-in 240ms var(--ease-out)" }}
      >
        {/* Header — avatar + name + email + close */}
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--rule-strong)] px-4 py-[18px]">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-hidden="true"
              className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden bg-ink font-mono text-[18px] font-bold leading-none text-paper"
            >
              {imageUrl ? (
                // biome-ignore lint/performance/noImgElement: Clerk avatar URLs aren't preconfigured for next/image.
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : isLoaded ? (
                initial
              ) : (
                ""
              )}
            </div>
            <div className="min-w-0">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-bold leading-[1.2] text-ink lowercase">
                {name}
              </div>
              {email ? (
                <div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] italic text-ink-3">
                  {email}
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="close menu"
            className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-[4px] bg-transparent p-0 text-ink-3 transition-colors duration-[160ms] ease-out hover:bg-paper-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — theme toggle */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="flex items-center justify-between gap-3 px-4 py-[14px] pt-4">
            <Eyebrow className="text-ink-2">THEME</Eyebrow>
            <div className="flex overflow-hidden rounded-[4px] border border-[color:var(--rule-strong)]">
              <SegBtn active={!isDark} onClick={() => setTheme("light")}>
                LIGHT
              </SegBtn>
              <SegBtn active={isDark} onClick={() => setTheme("dark")}>
                DARK
              </SegBtn>
            </div>
          </div>
        </div>

        {/* Footer — sign out */}
        <div className="border-t border-[color:var(--rule-strong)] px-4 pb-[18px] pt-3">
          <SignOutButton>
            <button
              type="button"
              className="block w-full cursor-pointer rounded-[4px] border border-signal bg-transparent px-[14px] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-signal transition-colors duration-[160ms] ease-out hover:bg-signal hover:text-white"
            >
              SIGN OUT
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[56px] cursor-pointer border-0 px-3 py-[7px] font-mono text-[10px] font-bold tracking-[0.14em] transition-colors duration-[160ms] ease-out",
        active
          ? "bg-ink text-paper"
          : "bg-transparent text-ink-3 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
