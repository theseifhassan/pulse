"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PulseMark } from "~/components/site/pulse-mark";
import { UserSheet } from "~/components/site/user-sheet";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 6);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b border-[color:var(--rule)]"
        style={{
          background: scrolled
            ? "color-mix(in srgb, var(--paper) 82%, transparent)"
            : "var(--paper)",
          backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
          transition: "background var(--dur-2) var(--ease-out)",
        }}
      >
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-2.5 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 no-underline hover:no-underline"
          >
            <PulseMark size={18} />
            <span className="text-[12px] font-bold tracking-[0.14em] text-ink">
              PULSE
            </span>
          </Link>
          <button
            type="button"
            aria-label="open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-[4px] bg-transparent p-0 text-ink transition-colors duration-[160ms] ease-out hover:bg-paper-2"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>
      <UserSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
