import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { PulseMark } from "~/components/site/pulse-mark";

function formatDate(d: Date): string {
  const weekday = d
    .toLocaleString("en-US", { weekday: "short" })
    .toUpperCase()
    .slice(0, 3);
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${weekday} · ${month} ${day} · ${hh}:${mm}`;
}

export function SiteHeader() {
  const date = formatDate(new Date());
  return (
    <header
      className="sticky top-0 z-40 border-b border-[color:var(--rule)]"
      style={{
        background: "rgba(242, 238, 230, 0.82)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline hover:no-underline"
        >
          <PulseMark size={16} />
          <span className="text-[12px] font-bold tracking-[0.06em] text-ink">
            PULSE
          </span>
        </Link>
        <time
          className="hidden text-[11px] tracking-[0.06em] text-ink-3 sm:block"
          dateTime={new Date().toISOString()}
        >
          {date}
        </time>
        <nav className="flex items-center gap-3">
          <Link
            href="/history"
            className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-3 no-underline hover:text-signal hover:no-underline"
          >
            INBOX
          </Link>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </nav>
      </div>
    </header>
  );
}
