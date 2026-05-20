import { UserButton } from "@clerk/nextjs";
import { History, Inbox } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--rule)] bg-[color:var(--paper)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-serif text-lg font-semibold tracking-tight text-[color:var(--ink)] hover:text-[color:var(--accent)]"
        >
          Pulse
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            aria-label="Unread feed"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-sm text-[color:var(--ink-soft)] hover:bg-[color:var(--paper-2)] hover:text-[color:var(--ink)]"
          >
            <Inbox className="h-5 w-5" />
          </Link>
          <Link
            href="/history"
            aria-label="History"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-sm text-[color:var(--ink-soft)] hover:bg-[color:var(--paper-2)] hover:text-[color:var(--ink)]"
          >
            <History className="h-5 w-5" />
          </Link>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "min-h-[36px] min-w-[36px]",
              },
            }}
          />
        </nav>
      </div>
    </header>
  );
}
