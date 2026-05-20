import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { PulseMark } from "~/components/site/pulse-mark";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-[color:var(--rule)]"
      style={{
        background: "color-mix(in srgb, var(--paper) 82%, transparent)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
      }}
    >
      <div className="mx-auto flex h-12 max-w-[640px] items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline hover:no-underline"
        >
          <PulseMark size={18} />
          <span className="text-[12px] font-bold tracking-[0.14em] text-ink">
            PULSE
          </span>
        </Link>
        <UserButton
          appearance={{
            elements: {
              // Square monogram, mono — fits the design's "square favicon-style
              // marks" pattern. No round avatar.
              avatarBox:
                "h-7 w-7 rounded-none [&_img]:rounded-none [&_div]:rounded-none",
              userButtonAvatarBox: "rounded-none",
              userButtonTrigger: "rounded-none focus:shadow-none",
            },
          }}
        />
      </div>
    </header>
  );
}
