export interface DayGroup<T> {
  readonly key: string;
  readonly label: string;
  readonly items: readonly T[];
}

function startOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function dayLabel(d: Date, now: Date): { key: string; label: string } {
  // Day boundaries are evaluated in UTC so client/server agree on which
  // signals fall into "today". Local-TZ display is a presentation concern;
  // grouping is data-shape.
  const today = startOfDayUTC(now);
  const that = startOfDayUTC(d);
  const diffDays = Math.round(
    (today.getTime() - that.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return { key: "today", label: "TODAY" };
  if (diffDays === 1) return { key: "yesterday", label: "YESTERDAY" };
  const weekday = d
    .toLocaleString("en-US", { weekday: "short", timeZone: "UTC" })
    .toUpperCase()
    .slice(0, 3);
  const month = d
    .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
    .toUpperCase();
  const day = String(d.getUTCDate()).padStart(2, "0");
  const isoDay = that.toISOString().slice(0, 10);
  return { key: isoDay, label: `${weekday} · ${month} ${day}` };
}

// Group items by their day in the local timezone, preserving order. Items are
// expected to already be in the order they should render (newest first).
export function groupByDay<
  T extends { createdAt: string; readAt: string | null },
>(
  items: readonly T[],
  variant: "feed" | "archived",
  now: Date = new Date(),
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const stamp =
      variant === "archived" && item.readAt ? item.readAt : item.createdAt;
    const d = new Date(stamp);
    const { key, label } = dayLabel(d, now);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      (last.items as T[]).push(item);
    } else {
      groups.push({ key, label, items: [item] });
    }
  }
  return groups;
}
